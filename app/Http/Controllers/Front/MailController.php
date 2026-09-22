<?php

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Controller;
use App\Http\Requests\MailSendRequest;
use App\Mail\DinasMail;
use App\Models\MailContact;
use App\Models\MailMessage;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Throwable;

/**
 * Email Dinas (TASK_56): surat keluar dari kotak surat Damkar kabupaten ke pejabat, dikirim
 * dari dalam Sisupit sehingga operator tak perlu membuka aplikasi lain.
 *
 * TIGA HAL YANG MENGIKAT DI BERKAS INI:
 *
 * 1. Penerima SELALU lewat MailSendRequest (daftar putih `mail_contacts`) — tulis baru, balas,
 *    maupun teruskan. Jangan pernah memanggil Mail::...->to() dengan alamat yang tidak lewat
 *    Request itu.
 * 2. Pengiriman memakai mailer RUNTIME milik tenant (Mail::build), bukan mailer bawaan.
 *    `.env` adalah alamat SISTEM (verifikasi pendaftaran & reset password); surat resmi Damkar
 *    yang terkirim dari sana bukan cacat kosmetik — penerimanya pejabat. TASK_56 §1.2.
 * 3. Tiap percobaan kirim meninggalkan satu baris `mail_messages`, BERHASIL MAUPUN GAGAL.
 *    Jejak yang hanya mencatat keberhasilan tak bisa menjawab "kenapa surat itu tak pernah
 *    sampai".
 */
class MailController extends Controller
{
    /**
     * K5: petugas boleh MENGIRIM; yang boleh mengubah daftar penerimanya hanya admin.
     *
     * PUBLIC karena MailSendRequest::authorize() membacanya juga — gerbang kirim harus sudah
     * tertutup SEBELUM rules() berjalan, sebab FormRequest divalidasi lebih dulu daripada
     * method controller. Satu daftar peran, dibaca dua tempat; jangan menulis daftar kedua.
     */
    public const PERAN_PENGIRIM = ['petugas', 'admin', 'superadmin'];

    public function index(Request $request)
    {
        $tenant = $this->kotakSurat();

        $messages = MailMessage::query()
            ->filter($request->only(['search']))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (MailMessage $message) => [
                'id' => $message->id,
                'subject' => $message->subject,
                'penerima' => $message->penerimaRingkas(),
                'sender_name' => $message->sender_name,
                'status' => $message->status,
                'created_at' => $message->created_at,
            ]);

        return Inertia::render('Mail/Index', [
            'messages' => $messages,
            'filters' => $request->only(['search']),
            'mailbox' => $this->profilPengirim($tenant),
        ]);
    }

    public function create()
    {
        $tenant = $this->kotakSurat();

        return Inertia::render('Mail/Create', [
            'contacts' => MailContact::untukPemilih(),
            'mailbox' => $this->profilPengirim($tenant),
        ]);
    }

    public function store(MailSendRequest $request)
    {
        $tenant = $this->kotakSurat();
        $user = $request->user();

        // Penerima di-SNAPSHOT (alamat + nama saat dikirim), bukan ditautkan ke mail_contacts:
        // kontak bisa dinonaktifkan atau berganti jabatan, dan surat yang sudah terkirim tidak
        // boleh ikut berubah isinya. Pola yang sama dengan report_agencies.agency_name.
        $kontak = MailContact::untukPemilih()->keyBy(fn (MailContact $c) => mb_strtolower($c->email));
        $snapshot = fn (array $emails) => collect($emails)
            ->map(fn (string $email) => [
                'email' => $email,
                'name' => $kontak->get(mb_strtolower($email))?->name,
            ])->all();

        $to = $request->input('to', []);
        $cc = $request->input('cc', []);

        $status = MailMessage::STATUS_TERKIRIM;
        $error = null;

        try {
            // Mailer BERNAMA per tenant, bukan mailer bawaan. Mendaftarkan entri baru di
            // `mail.mailers.*` tidak menyentuh `mail.default` maupun `mail.mailers.smtp`,
            // jadi email SISTEM (verifikasi pendaftaran, reset password) yang mungkin terkirim
            // di request yang sama tetap lewat jalurnya sendiri — TASK_56 §1.2.
            config(['mail.mailers.'.$tenant->mailerName() => $tenant->mailerConfig()]);

            $pengiriman = Mail::mailer($tenant->mailerName())->to($to);

            if ($cc !== []) {
                $pengiriman->cc($cc);
            }

            $pengiriman->send(new DinasMail(
                judul: $request->input('subject'),
                isi: $request->input('body'),
                fromAddress: $tenant->mail_from_address,
                fromName: $tenant->mail_from_name,
                balasKe: $tenant->mail_reply_to,
                tandaTangan: $tenant->mail_signature,
            ));
        } catch (Throwable $e) {
            $status = MailMessage::STATUS_GAGAL;
            $error = $e->getMessage();
        }

        MailMessage::create([
            'user_id' => $user->id,
            'sender_name' => $user->name,
            'from_email' => $tenant->mail_from_address,
            'from_name' => $tenant->mail_from_name,
            'to' => $snapshot($to),
            'cc' => $cc === [] ? null : $snapshot($cc),
            'subject' => $request->input('subject'),
            'body' => $request->input('body'),
            'status' => $status,
            'error' => $error,
            'sent_at' => $status === MailMessage::STATUS_TERKIRIM ? now() : null,
            'province_code' => $user->province_code,
            'city_code' => $user->city_code,
            'district_code' => $user->district_code,
            'village_code' => $user->village_code,
        ]);

        if ($status === MailMessage::STATUS_GAGAL) {
            // Pesan galat MENTAH sengaja tidak ditampilkan ke pengirim (anti-pola yang sudah
            // ada di repo ini & dilarang diperluas, CONVENTIONS.md): isinya bisa memuat host,
            // username, atau balasan server. Yang mentah tersimpan di `mail_messages.error`
            // untuk admin.
            flashMessage('Surat gagal dikirim. Minta admin memeriksa pengaturan Email Dinas, lalu coba lagi.', 'error');

            return back();
        }

        flashMessage('Surat berhasil dikirim.');

        return redirect()->route('mail.index');
    }

    /**
     * Gerbang tunggal: peran (K5) lalu ketersediaan kotak surat. Tenant tanpa fitur / tanpa
     * kredensial menghasilkan 404 — sama dengan fitur mati, sebab layar kirim yang muncul tapi
     * selalu gagal terbaca sebagai bug, bukan sebagai "belum disetel" (TASK_45/#94).
     */
    private function kotakSurat(): Tenant
    {
        $user = auth()->user();

        abort_unless($user?->hasAnyRole(self::PERAN_PENGIRIM), 403);

        $tenant = Tenant::mailboxFor($user);

        abort_if($tenant === null, 404);

        return $tenant;
    }

    /** Yang boleh diketahui LAYAR soal kotak surat: alamatnya saja. Tidak pernah kredensialnya. */
    private function profilPengirim(Tenant $tenant): array
    {
        return [
            'address' => $tenant->mail_from_address,
            'name' => $tenant->mail_from_name,
        ];
    }
}
