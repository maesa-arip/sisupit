<?php

namespace App\Notifications\Concerns;

/**
 * Akun demo (TASK_81): mencatat apakah notifikasi ini DIPICU akun demo.
 *
 * Dicap di konstruktor karena di sanalah pemicunya masih diketahui (di dalam request). Sebagian
 * besar notifikasi ShouldQueue, dan saat dikirim di worker auth()->user() sudah kosong. Properti
 * ini ikut terserialisasi ke antrean, lalu dibaca App\Listeners\SenyapkanNotifikasiAkunDemo.
 *
 * Notifikasi BARU wajib memanggil catatPemicu() di konstruktornya - kalau lupa, aksi akun demo
 * membunyikan notifikasi itu ke pengguna asli (dijaga AkunDemoTest).
 */
trait DipicuAkunDemo
{
    public bool $dipicuAkunDemo = false;

    protected function catatPemicu(): void
    {
        $this->dipicuAkunDemo = (bool) auth()->user()?->is_demo;
    }
}
