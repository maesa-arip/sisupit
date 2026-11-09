<?php

namespace App\Models;

use App\Traits\Tenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Ulasan aplikasi Sisupit dari penggunanya (TASK_86). Disimpan di database SENDIRI, bukan
 * Play Store/App Store (keputusan user 2026-11-01): satu web melayani browser, APK, iOS, dan exe
 * desktop, jadi fitur ini muncul di semua platform tanpa rilis aplikasi baru.
 *
 * Aturan yang dipegang di sini - jangan disalin ke controller/JSX:
 *  - SATU ulasan per pengguna (UNIQUE user_id); menyunting = menimpa.
 *  - Tamu tidak bisa mengulas (route di grup auth, keputusan user). Semua peran boleh.
 *  - Ajakan otomatis di dashboard & detail laporan Selesai = shouldAsk(): bukan akun demo, belum
 *    mengulas, tidak sedang meluncur/di TKP, tidak baru ditunda, dan HANYA sesudah kejadian yang ia
 *    laporkan atau ikut tangani dinyatakan Selesai (#239; dulu cukup akun >= 7 hari).
 *  - Testimoni publik = persetujuan pengguna (allow_public) DAN admin (approved_at). Komentar
 *    yang diubah sesudah disetujui kembali menunggu - yang disetujui admin adalah teks itu.
 */
class AppReview extends Model
{
    use Tenantable;

    /** Tag cepat. Kunci disimpan, label ditampilkan; daftar ini dikirim ke layar lewat formProps(). */
    public const TAGS = [
        'mudah_dipakai' => 'Mudah dipakai',
        'respons_cepat' => 'Respons cepat',
        'notifikasi_membantu' => 'Notifikasi membantu',
        'peta_membantu' => 'Peta membantu',
        'membingungkan' => 'Membingungkan',
        'lambat' => 'Lambat',
        'sering_error' => 'Sering error',
    ];

    public const PLATFORMS = [
        'android' => 'Aplikasi Android',
        'ios' => 'Aplikasi iOS',
        'desktop' => 'Aplikasi Desktop',
        'web' => 'Browser',
    ];

    /**
     * Peran yang di-snapshot + labelnya untuk berkas ekspor. Urutan & label WAJIB sama dengan
     * ROLE_LABELS di lib/utils.js (yang paling menentukan wewenang di depan) - dijaga AppReviewTest.
     */
    public const ROLES = [
        'superadmin' => 'Superadmin',
        'admin' => 'Administrator',
        'pejabat' => 'Pejabat/Eksekutif',
        'petugas' => 'Petugas Damkar',
        'opd' => 'OPD / Instansi Terkait',
        'relawan' => 'Relawan Aktif',
        'warga' => 'Warga',
    ];

    /** "Nanti saja" menunda ajakan selama ini. */
    public const SNOOZE_DAYS = 30;

    public const COMMENT_MAX = 500;

    protected $guarded = [];

    protected $casts = [
        'rating' => 'integer',
        'tags' => 'array',
        'allow_public' => 'boolean',
        'approved_at' => 'datetime',
        'is_demo' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Platform dari token User-Agent (mobile/KONTRAK.md §1). iPadOS ber-UA "Macintosh", tapi
     * token SisupitApp hanya dipasang wrapper Android & iOS, dan Android tak pernah ber-UA
     * Macintosh - jadi di dalam aplikasi Macintosh berarti iPad.
     */
    public static function platformFrom(Request $request): string
    {
        $agent = $request->userAgent() ?? '';

        if (str_contains($agent, 'SisupitDesktop')) {
            return 'desktop';
        }

        if (str_contains($agent, 'SisupitApp')) {
            return preg_match('/iPhone|iPad|iPod|Macintosh/', $agent) ? 'ios' : 'android';
        }

        return 'web';
    }

    public static function roleOf(User $user): ?string
    {
        return collect(array_keys(self::ROLES))->first(fn (string $role) => $user->hasRole($role));
    }

    /** Ulasan milik pengguna ini, apa pun wilayahnya sekarang. */
    public static function ownedBy(User $user): ?self
    {
        // Tenantable dilepas karena wilayah akun bisa berubah sesudah ulasan ditulis; pengganti
        // proteksinya adalah syarat user_id = pemilik itu sendiri.
        return self::withoutGlobalScopes()->where('user_id', $user->id)->first();
    }

    /** Apakah ajakan mengulas boleh tampil bagi pengguna ini (di dashboard, atau di detail $report)? */
    public static function shouldAsk(User $user, ?Report $report = null): bool
    {
        if ($user->is_demo || self::ownedBy($user)) {
            return false;
        }

        $prompt = DB::table('app_review_prompts')->where('user_id', $user->id)->first();
        if ($prompt && ($prompt->never_ask
            || ($prompt->dismissed_at && now()->subDays(self::SNOOZE_DAYS)->lt($prompt->dismissed_at)))) {
            return false;
        }

        // Jangan pernah di tengah misi: petugas/relawan yang sedang Meluncur atau Tiba.
        foreach (['report_officers', 'report_helpers'] as $table) {
            if (DB::table($table)->where('user_id', $user->id)->whereIn('status', ['en_route', 'arrived'])->exists()) {
                return false;
            }
        }

        // #239 (keputusan user 2026-11-09): HANYA sesudah kejadian yang ia laporkan atau ikut
        // tangani (Meluncur/Tiba - baris report_officers/report_helpers; batal Meluncur menghapus
        // barisnya) dinyatakan Selesai. Dulu cukup akun >= 7 hari. Dengan $report: kejadian itu saja
        // (kartu di detail laporan); tanpa: kejadian Selesai mana pun (kartu di dashboard).
        return self::resolvedIncidentsOf($user)
            ->when($report, fn ($query) => $query->whereKey($report->id))
            ->exists();
    }

    /**
     * Laporan Selesai yang dibuat ATAU ikut ditangani pengguna ini. Tenantable dilepas karena wilayah
     * akun bisa berubah sesudah kejadian; pengganti proteksinya adalah syarat keterlibatan user_id
     * itu sendiri (pelapor atau baris penanganan miliknya).
     */
    private static function resolvedIncidentsOf(User $user)
    {
        return Report::withoutGlobalScopes()
            ->where('status', 'resolved')
            ->where(fn ($query) => $query->where('user_id', $user->id)
                ->orWhereIn('id', DB::table('report_officers')->where('user_id', $user->id)->select('report_id'))
                ->orWhereIn('id', DB::table('report_helpers')->where('user_id', $user->id)->select('report_id')));
    }

    /** Data form ulasan untuk layar: ulasan sendiri (bila ada) + pilihan tag. */
    public static function formProps(User $user): array
    {
        $mine = self::ownedBy($user);

        return [
            'mine' => $mine ? [
                'rating' => $mine->rating,
                'tags' => $mine->tags ?? [],
                'comment' => $mine->comment ?? '',
                'allow_public' => $mine->allow_public,
                'approved' => $mine->approved_at !== null,
                'updated_at' => $mine->updated_at,
            ] : null,
            'tags' => collect(self::TAGS)->map(fn ($label, $key) => ['value' => $key, 'label' => $label])->values()->all(),
        ];
    }

    /**
     * Testimoni untuk halaman depan. Tenantable dilepas karena halaman ini publik (tamu & akun mana
     * pun melihat hal yang sama); pengganti proteksinya adalah DUA persetujuan di bawah - hanya
     * ulasan yang pemiliknya izinkan DAN admin setujui yang pernah keluar dari sini. Kota mengikuti
     * subdomain tenant (null = apex = semua kota, pola HomeController::pageStats).
     */
    public static function testimonials(?string $cityCode, int $limit = 6): array
    {
        return self::withoutGlobalScopes()
            ->where('allow_public', true)
            ->whereNotNull('approved_at')
            ->where('is_demo', false)
            ->whereNotNull('comment')
            ->where('comment', '!=', '')
            ->when($cityCode, fn ($q) => $q->where('city_code', $cityCode))
            ->with('user:id,name')
            ->latest('approved_at')
            ->limit($limit)
            ->get()
            ->map(fn (self $review) => [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'name' => self::publicName($review->user?->name),
                'role' => $review->role,
            ])
            ->all();
    }

    /**
     * Nama yang boleh tampil publik: nama sapaan + inisial nama terakhir ("I Wayan Sudarta" ->
     * "Wayan S."). Nama sapaan = kata pertama >= 3 huruf, aturan yang sama dengan
     * resources/js/lib/first-name.js (nama Bali berawalan I/Ni).
     */
    public static function publicName(?string $name): string
    {
        $words = preg_split('/\s+/', trim((string) $name), -1, PREG_SPLIT_NO_EMPTY);
        $first = collect($words)->first(fn ($word) => mb_strlen($word) >= 3) ?? ($words[0] ?? null);

        if (! $first) {
            return 'Pengguna Sisupit';
        }

        $last = end($words);

        return $last !== $first ? $first.' '.mb_strtoupper(mb_substr($last, 0, 1)).'.' : $first;
    }
}
