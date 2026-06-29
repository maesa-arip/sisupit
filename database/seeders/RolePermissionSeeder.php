<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ==========================================
        // 1. Buat Semua Permissions (Hak Akses)
        // ==========================================
        $permissions = [
            'manage_regions',    // (Khusus Superadmin) Menambah Provinsi/Kota ke sistem
            'manage_users',      // CRUD User (Masyarakat, Relawan, Petugas, Admin bawahan)
            'manage_facilities', // CRUD Aset Fisik (Pos Damkar, Hydrant, Pompa, dll)
            'manage_reports',    // Mengubah status laporan darurat (Proses -> Selesai)
            'create_reports',    // Mengirimkan laporan kebakaran/darurat
            'view_dashboard',    // Melihat Dashboard Analitik & Peta Realtime
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // ==========================================
        // 2. Buat Roles dan Assign Permissions
        // ==========================================

        // F. Superadmin Pusat (Developer Sisupit)
        // Tidak perlu di-assign manual, otomatis di-bypass via AuthServiceProvider (Gate::before)
        Role::firstOrCreate(['name' => 'superadmin']);

        // E. Admin Wilayah (Berlaku untuk Admin Provinsi, Kota, maupun Desa)
        // Pembatasan wilayah BUKAN dilakukan disini, melainkan melalui Query Tenant di Controller!
        $roleAdmin = Role::firstOrCreate(['name' => 'admin']);
        $roleAdmin->givePermissionTo([
            'manage_users',
            'manage_facilities',
            'manage_reports',
            'view_dashboard',
        ]);

        // D. Pejabat Daerah (Bupati/Gubernur/Kadis) -> Sifatnya "Read-Only/Pemantau"
        $rolePejabat = Role::firstOrCreate(['name' => 'pejabat']);
        $rolePejabat->givePermissionTo(['view_dashboard']);

        // C. Petugas Damkar Lapangan / Operator
        $rolePetugas = Role::firstOrCreate(['name' => 'petugas']);
        $rolePetugas->givePermissionTo([
            'create_reports',
            'manage_reports',
            'view_dashboard',
        ]);

        // B. Relawan Lapangan
        $roleRelawan = Role::firstOrCreate(['name' => 'relawan']);
        $roleRelawan->givePermissionTo(['create_reports']);

        // A. Masyarakat Umum
        $roleMasyarakat = Role::firstOrCreate(['name' => 'masyarakat']);
        $roleMasyarakat->givePermissionTo(['create_reports']);

    }
}
