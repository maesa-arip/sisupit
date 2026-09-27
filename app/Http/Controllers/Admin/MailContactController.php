<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MailContact;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Daftar Penerima Email Dinas (TASK_56, K4) — master pejabat yang boleh dikirimi surat.
 * Ter-scope wilayah via Tenantable (model MailContact). Pola dasar: Admin\AgencyController.
 *
 * SENGAJA TERPISAH DARI /admin/agencies: yang didata di sini ORANG (pejabat), di sana
 * ORGANISASI yang dilibatkan menangani insiden. Menaruh pejabat di `agencies` membuat namanya
 * muncul sebagai instansi yang bisa dimintai bantuan saat kebakaran. Uraian: TASK_56 §3.1.
 *
 * GERBANGNYA `admin|superadmin` (dipasang di routes/web.php) — dan itu yang membuat K5 aman:
 * petugas boleh MENGIRIM surat, tapi tidak boleh menambah orang yang bisa dikirimi.
 */
class MailContactController extends Controller
{
    public function index(Request $request)
    {
        $contacts = MailContact::query()
            ->filter($request->only(['search']))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/MailContacts/Index', [
            'contacts' => $contacts,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/MailContacts/Create');
    }

    public function store(Request $request)
    {
        MailContact::create($this->withTenantCodes($this->validateData($request)));

        flashMessage('Penerima berhasil ditambahkan.');

        return redirect()->route('admin.mail-contacts.index');
    }

    public function edit(MailContact $mail_contact)
    {
        return Inertia::render('Admin/MailContacts/Edit', [
            'contact' => $mail_contact,
        ]);
    }

    public function update(Request $request, MailContact $mail_contact)
    {
        $mail_contact->update($this->withTenantCodes($this->validateData($request)));

        flashMessage('Data penerima berhasil diperbarui.');

        return redirect()->route('admin.mail-contacts.index');
    }

    public function destroy(MailContact $mail_contact)
    {
        // SoftDeletes: surat lama tetap menyebut nama & alamat penerimanya lewat kolom snapshot
        // di mail_messages, jadi menghapus kontak tidak menghilangkan jejak korespondensi.
        $mail_contact->delete();

        flashMessage('Penerima berhasil dihapus.');

        return redirect()->back();
    }

    /**
     * Salin instansi ber-email dari master OPD jadi kontak. Tindakan yang TERLIHAT dan sekali
     * jalan — bukan sumber kedua yang dibaca gerbang kirim diam-diam. Gerbang tetap membaca
     * satu tabel saja (TASK_56 §3.1 aturan 1).
     */
    public function tarikDariAgency()
    {
        $baru = MailContact::tarikDariAgency($this->withTenantCodes([]));

        flashMessage($baru > 0
            ? "{$baru} penerima ditambahkan dari master OPD."
            : 'Tidak ada alamat baru di master OPD — semuanya sudah terdaftar.');

        return redirect()->back();
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'jabatan' => 'nullable|string|max:255',
            'instansi' => 'nullable|string|max:255',
            'email' => 'required|email|max:255',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);
    }

    // Yurisdiksi admin menentukan wilayah kontak — admin wilayah tak bisa menyimpan penerima di
    // luar wewenangnya, dan tak bisa mengirimi penerima kabupaten lain (gerbang kirim membaca
    // daftar yang sama, ter-Tenantable). Sama persis dengan Admin\AgencyController.
    private function withTenantCodes(array $validated): array
    {
        $user = auth()->user();
        $validated['province_code'] = $user->province_code;
        $validated['city_code'] = $user->city_code;
        $validated['district_code'] = $user->district_code;
        $validated['village_code'] = $user->village_code;

        return $validated;
    }
}
