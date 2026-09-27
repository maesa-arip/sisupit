<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TenantLevel;
use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Tingkat siaran notifikasi PETUGAS per kabupaten, diatur ADMIN KABUPATEN sendiri (TASK_62).
 *
 * Setelan global superadmin (/admin/settings) tetap ada dan jadi BAWAAN: kabupaten yang belum
 * menyimpan pilihan di sini mengikutinya. Yang dihitung dari pilihan ini ada di SATU tempat,
 * Tenant::petugasNotifyLevel().
 *
 * ATURAN YANG MENGIKAT (pola MailSettingController):
 * 1. Kabupaten yang disunting ditentukan `city_code` AKUN lewat Tenant::notifyLevelEditableBy(),
 *    TIDAK PERNAH dari request (FINDINGS #1, P0). Admin kecamatan/desa mendapat 404 - mereka
 *    tidak boleh mengubah setelan seluruh kabupaten.
 * 2. Pilihan dibatasi Tenant::NOTIFY_LEVELS_PETUGAS (desa s/d kabupaten). Kosong = ikut global.
 */
class NotificationLevelController extends Controller
{
    public function edit()
    {
        $tenant = $this->tenantAkun();
        $global = TenantLevel::tryFrom((string) Setting::getValue(Setting::KEY_NOTIFY_LEVEL_PETUGAS))
            ?? TenantLevel::KABUPATEN;

        return Inertia::render('Admin/NotificationLevel/Edit', [
            'page_settings' => [
                'title' => 'Jangkauan Petugas',
                'subtitle' => 'Atur sampai tingkat wilayah mana petugas di kabupaten Anda menerima notifikasi dan melihat data',
                'action' => route('admin.notification-level.update'),
            ],
            'notify_level_petugas' => $tenant->notify_level_petugas ?? '',
            'levels' => collect(Tenant::NOTIFY_LEVELS_PETUGAS)
                ->map(fn (TenantLevel $level) => ['value' => $level->value, 'label' => $level->label()])
                ->values(),
            'global_level_label' => $global->label(),
            'nama_instansi' => $tenant->nama_instansi,
        ]);
    }

    public function update(Request $request)
    {
        $tenant = $this->tenantAkun();

        $validated = $request->validate([
            'notify_level_petugas' => [
                'nullable',
                Rule::in(array_map(fn (TenantLevel $level) => $level->value, Tenant::NOTIFY_LEVELS_PETUGAS)),
            ],
        ]);

        $tenant->update(['notify_level_petugas' => $validated['notify_level_petugas'] ?? null]);

        flashMessage('Jangkauan petugas disimpan.');

        return redirect()->route('admin.notification-level.edit');
    }

    private function tenantAkun(): Tenant
    {
        $tenant = Tenant::notifyLevelEditableBy(auth()->user());

        abort_if($tenant === null, 404);

        return $tenant;
    }
}
