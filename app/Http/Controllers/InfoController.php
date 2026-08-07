<?php

namespace App\Http\Controllers;

use App\Enums\TenantEdition;
use Inertia\Response;

/**
 * Halaman informasi publik (TASK_19): Syarat & Ketentuan, Kebijakan Privasi, Pusat Bantuan,
 * Tentang Aplikasi, dan Paket & Lisensi.
 *
 * Isi dokumen ditulis statis di komponen React (pola halaman Guideline), tetapi PIHAK yang
 * disebut di dalamnya datang dari data: instansi penyelenggara diambil dari tenant aktif
 * (subdomain) dan paket layanannya dari kolom `tenants.edition`. Jadi Klungkung cukup
 * ditambahkan lewat form /admin/tenants — dokumen legalnya ikut benar tanpa sentuh kode.
 *
 * Halaman Syarat & Ketentuan memuat DUA dokumen dalam satu halaman bertab: ketentuan untuk
 * pengguna umum (warga/petugas/relawan) dan ketentuan untuk Pengguna Berkontrak (instansi
 * yang terikat PKS). Keduanya berbagi identitas penyedia dari config/legal.php.
 *
 * Semua route di sini PUBLIK (tanpa auth): dokumen legal harus bisa dibaca sebelum orang
 * membuat akun, dan Google/Play Store mensyaratkan URL kebijakan yang terbuka.
 */
class InfoController extends Controller
{
    public function terms(): Response
    {
        return inertia('Info/Terms', [
            'instansi' => $this->instansi(),
            'legal' => $this->legal(),
        ]);
    }

    public function privacy(): Response
    {
        return inertia('Info/Privacy', [
            'instansi' => $this->instansi(),
            'legal' => $this->legal(),
        ]);
    }

    public function help(): Response
    {
        return inertia('Info/Help', [
            'instansi' => $this->instansi(),
            'legal' => $this->legal(),
        ]);
    }

    public function about(): Response
    {
        return inertia('Info/About', [
            'instansi' => $this->instansi(),
            'legal' => $this->legal(),
        ]);
    }

    public function pricing(): Response
    {
        return inertia('Info/Pricing', [
            'instansi' => $this->instansi(),
            'legal' => $this->legal(),
            'editions' => collect(TenantEdition::cases())->map(fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
                'description' => $case->description(),
            ])->all(),
        ]);
    }

    /**
     * Identitas instansi penyelenggara di wilayah yang sedang dibuka. Namanya sengaja
     * `instansi`, bukan `tenant`, agar tidak menimpa shared prop `tenant` milik
     * HandleInertiaRequests yang dipakai komponen lain.
     */
    private function instansi(): array
    {
        $tenant = currentTenant();

        return [
            'nama_instansi' => $tenant->nama_instansi,
            'telepon_darurat' => $tenant->telepon_darurat,
            'email_kontak' => $tenant->email_kontak,
            'alamat_instansi' => $tenant->alamat_instansi,
            'penanggung_jawab_data' => $tenant->penanggung_jawab_data,
            'subdomain' => $tenant->subdomain,
            'edition' => $tenant->edition()->value,
            'edition_label' => $tenant->edition()->label(),
            'edition_description' => $tenant->edition()->description(),
        ];
    }

    private function legal(): array
    {
        return [
            'penyedia' => config('legal.penyedia'),
            'dokumen' => config('legal.dokumen'),
            'aplikasi_versi' => config('legal.aplikasi_versi'),
            'retensi_bulan' => config('legal.retensi_bulan'),
        ];
    }
}
