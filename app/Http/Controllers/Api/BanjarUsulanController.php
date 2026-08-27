<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banjar;
use App\Traits\ResolvesFacilityJurisdiction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Warga mengusulkan banjar yang belum ada di master (permintaan user 2026-08-26).
 *
 * Kenapa ada: daftar banjar bernama tidak pernah diterbitkan utuh — DPMA hanya menerbitkan
 * JUMLAH, dan panen dari situs resmi desa cuma menutupi 32 dari 43 desa Denpasar. Warga di
 * sebelas desa sisanya akan berhadapan dengan dropdown kosong. Merekalah yang paling tahu nama
 * banjarnya sendiri.
 *
 * Usulan masuk ke tabel `banjars` yang SAMA dengan status `usulan`, bukan ke tabel usulan
 * terpisah — alasannya ada di migrasi 2026_08_26_140000. Yang membedakan usulan dari baris
 * resmi hanyalah satu kolom, sehingga menyetujuinya cukup membalik kolom itu dan seluruh
 * `users.banjar_id`/`hydrant_wargas.banjar_id` yang menunjuk ke sana tetap utuh.
 *
 * TIDAK di belakang scope wilayah, sama seperti GET /api/banjars: pemakainya justru warga yang
 * BELUM punya kode wilayah karena sedang mengisinya (#44). Penggantinya, sesuai ATURAN EMAS #7:
 * baris hanya bisa dibuat di desa yang dikirim, kode wilayahnya diturunkan dari kode desa itu
 * (bukan dari isian bebas), dan endpoint ini menuntut login.
 */
class BanjarUsulanController extends Controller
{
    use ResolvesFacilityJurisdiction;

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'village_code' => 'required|string|exists:indonesia_villages,code',
            'name' => 'required|string|min:3|max:100',
            // Dikirim layar hanya setelah pengguna melihat calon duplikatnya dan tetap memilih
            // membuat baru. Tanpa ini, dua banjar yang memang benar-benar mirip namanya (dan
            // itu lumrah: Tegal Kaja / Tegal Kelod) tak akan pernah bisa didaftarkan keduanya.
            'paksa' => 'sometimes|boolean',
        ], [
            'name.min' => 'Nama banjar terlalu pendek.',
            'village_code.exists' => 'Desa/Kelurahan tidak dikenal.',
        ]);

        $nama = Banjar::normalkanNama($data['name']);
        $desa = $data['village_code'];

        // Sudah ada persis: kembalikan yang lama. Menekan tombol dua kali tidak boleh
        // melahirkan dua baris, dan pengguna tetap mendapat banjar yang dia maksud.
        $persis = Banjar::withoutGlobalScope('tenant')
            ->where('village_code', $desa)
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($nama)])
            ->first();

        if ($persis) {
            return response()->json($this->bentuk($persis, 'sudah_ada'), 200);
        }

        // Mirip tapi tak sama: TAWARKAN, jangan gabungkan sendiri. Menggabungkan otomatis
        // adalah kesalahan yang sudah ditolak di importir (CATUR → SANUR).
        if (! ($data['paksa'] ?? false)) {
            $serupa = Banjar::cariSerupa($desa, $nama);

            if ($serupa) {
                return response()->json([
                    'status' => 'mirip',
                    'usulan' => $nama,
                    'serupa' => $this->bentuk($serupa, 'mirip'),
                ], 409);
            }
        }

        // Kode wilayah diturunkan dari kode desa lewat rantai awalan BPS — bukan dari isian
        // pengguna, dan tanpa query ke tabel indonesia_* (lihat trait-nya).
        $request->merge(['village_code' => $desa]);
        $kode = $this->resolveJurisdictionCodes($request);

        $banjar = Banjar::withoutGlobalScope('tenant')->create(array_merge($kode, [
            'name' => $nama,
            // Jenis TIDAK ditebak: warga tak selalu tahu banjarnya dinas atau adat, dan menebak
            // jauh lebih berbahaya daripada mengaku belum tahu (alasan yang sama di migrasinya).
            'jenis' => null,
            'status' => Banjar::STATUS_USULAN,
            'is_active' => true,
            'created_by' => $request->user()?->id,
        ]));

        return response()->json($this->bentuk($banjar, 'dibuat'), 201);
    }

    private function bentuk(Banjar $banjar, string $status): array
    {
        return [
            'status' => $status,
            'banjar' => [
                'id' => $banjar->id,
                'name' => $banjar->name,
                'jenis' => $banjar->jenis,
                'status' => $banjar->status,
            ],
        ];
    }
}
