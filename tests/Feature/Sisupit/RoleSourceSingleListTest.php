<?php

use Spatie\Permission\Models\Role;

/**
 * Peran `warga` (2026-09-02) — `UserTenantSeeder` memelihara DAFTAR PERAN KEDUA di samping
 * `RolePermissionSeeder`, dan daftar kedua itu menyimpang: ia menciptakan peran `warga` yang
 * tak pernah diberikan ke siapa pun, tak punya satu pun permission, dan tak dirujuk satu baris
 * pun di `app/` maupun `routes/`.
 *
 * Yang membuatnya berbahaya bukan barisnya, melainkan JALAN TAMPILNYA:
 * `Admin\UserController::allRoleNames()` membaca peran dari TABEL `roles`, bukan dari kode, dan
 * `roleOptions()` mencetak nama yang tak dikenal kamusnya lewat cadangan `ucfirst()`. Jadi
 * "Warga" muncul di dropdown Manajemen Pengguna tampak sederajat dengan "Masyarakat" —
 * sementara akun yang diberi peran itu justru menjadi akun TANPA peran yang dikenali (profilnya
 * sendiri berbunyi "Peran belum ditetapkan", gerbang mana pun yang mencari `masyarakat` tak
 * mengenalinya), tanpa satu pun galat. Bentuk yang sama dengan #90/#94: cadangan sebuah kamus
 * adalah KLAIM, bukan "tidak dikenal".
 *
 * Test ini tak bisa berdiri di atas DB: seeder yang membuat peran liar itu memang tidak pernah
 * dijalankan di test (tests/Pest.php hanya menyemai RolePermissionSeeder), dan itulah sebabnya
 * peran itu hidup bertahun-tahun tanpa satu pun test merah. Karena itu ia membaca BERKAS SUMBER
 * seeder — pola yang sama dengan MobileNavParityTest & RoleLabelParityTest.
 */
$seederFiles = fn () => glob(database_path('seeders/*.php'));

it('keeps the list of roles in one seeder', function () use ($seederFiles) {
    $offenders = [];

    foreach ($seederFiles() as $file) {
        if (basename($file) === 'RolePermissionSeeder.php') {
            continue;
        }

        // `Role::firstOrCreate` / `Role::create` di seeder mana pun selain sumbernya berarti
        // ada daftar peran kedua, dan daftar kedua selalu menyimpang tanpa gejala.
        if (preg_match('/\bRole::(firstOrCreate|create)\s*\(/', file_get_contents($file))) {
            $offenders[] = basename($file);
        }
    }

    expect($offenders)->toBe([]);
});

it('gives every role that exists a label in the user management dropdown', function () {
    // Kamus label itu `private` di dalam `roleOptions()`; visibilitas produksi TIDAK
    // dilonggarkan demi test (preseden: ReportsExport::STATUS_LABELS di TASK_48), jadi ia
    // dibaca dari berkas sumbernya.
    $source = file_get_contents(app_path('Http/Controllers/Admin/UserController.php'));

    preg_match('/\$labels = \[(.*?)\n        \];/s', $source, $block);

    expect($block)->not->toBeEmpty();

    preg_match_all("/'([^']+)' => '/", $block[1], $labelled);

    // Peran yang NYATA ada, bukan salinan daftar yang bisa ikut basi. Peran tanpa label tidak
    // gagal — ia tercetak mentah lewat `ucfirst()` dan karena itu tampak sah.
    foreach (Role::where('guard_name', 'web')->pluck('name') as $role) {
        expect($labelled[1])->toContain($role);
    }
});

/**
 * Peran `masyarakat` berganti nama jadi `warga` 2026-09-02 (permintaan user). Rename peran adalah
 * perubahan yang HANYA aman bila tuntas: nama itu hidup sebagai STRING di `assignRole()`,
 * `hasRole()`, `User::role()`, kamus label, dan daftar peran yang boleh diberikan admin — satu
 * saja tertinggal dan ia menunjuk peran yang tak ada lagi. Akibatnya bukan galat halus:
 * `assignRole()` melempar `RoleDoesNotExist`, jadi PENDAFTARAN WARGA BARU gagal total, sementara
 * `hasRole()` justru diam dan mengembalikan false — pemeriksaan izin yang senyap-salah.
 *
 * Migrasi `2026_09_02_100000_rename_role_masyarakat_to_warga.php` sengaja dikecualikan: di situlah
 * satu-satunya tempat nama lama masih WAJIB tertulis.
 */
it('leaves no reference to the old role name behind', function () {
    $roots = [app_path(), base_path('routes'), database_path('seeders'), resource_path('js')];
    $tertinggal = [];

    foreach ($roots as $root) {
        $berkas = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root));

        foreach ($berkas as $file) {
            if (! $file->isFile() || ! in_array($file->getExtension(), ['php', 'js', 'jsx'], true)) {
                continue;
            }

            if (str_contains(file_get_contents($file->getPathname()), "'masyarakat'")) {
                $tertinggal[] = str_replace(base_path().DIRECTORY_SEPARATOR, '', $file->getPathname());
            }
        }
    }

    expect($tertinggal)->toBe([]);
});
