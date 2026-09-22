<?php

namespace App\Http\Controllers\Admin;

use App\Enums\MessageType;
use App\Enums\TenantLevel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\NotificationSettingRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Inertia\Response;
use Throwable;

class SettingController extends Controller
{
    public function edit(): Response
    {
        return inertia('Admin/Settings/Edit', [
            'page_settings' => [
                'title' => 'Pengaturan Notifikasi',
                'subtitle' => 'Atur sampai tingkat wilayah mana notifikasi laporan darurat disiarkan.',
                'method' => 'PUT',
                'action' => route('admin.settings.update'),
            ],
            'levels' => TenantLevel::options(),
            'settings' => [
                'notify_level_petugas' => Setting::getValue(Setting::KEY_NOTIFY_LEVEL_PETUGAS, TenantLevel::KABUPATEN->value),
                'notify_level_relawan' => Setting::getValue(Setting::KEY_NOTIFY_LEVEL_RELAWAN, TenantLevel::DESA->value),
                'notify_level_pejabat' => Setting::getValue(Setting::KEY_NOTIFY_LEVEL_PEJABAT, TenantLevel::KABUPATEN->value),
                // Deteksi laporan ganda (TASK_55).
                'duplikat_radius_m' => (int) Setting::getValue(Setting::KEY_DUPLIKAT_RADIUS_M, (string) Setting::DEFAULT_DUPLIKAT_RADIUS_M),
                'duplikat_jendela_menit' => (int) Setting::getValue(Setting::KEY_DUPLIKAT_JENDELA_MENIT, (string) Setting::DEFAULT_DUPLIKAT_JENDELA_MENIT),
            ],
        ]);
    }

    public function update(NotificationSettingRequest $request): RedirectResponse
    {
        try {
            Setting::setValue(Setting::KEY_NOTIFY_LEVEL_PETUGAS, $request->notify_level_petugas);
            Setting::setValue(Setting::KEY_NOTIFY_LEVEL_RELAWAN, $request->notify_level_relawan);
            Setting::setValue(Setting::KEY_NOTIFY_LEVEL_PEJABAT, $request->notify_level_pejabat);
            // Opsional di request supaya pemanggil lama (tanpa kedua isian) tidak diam-diam
            // mengosongkan setelan deteksi laporan ganda.
            if ($request->filled('duplikat_radius_m')) {
                Setting::setValue(Setting::KEY_DUPLIKAT_RADIUS_M, (string) $request->integer('duplikat_radius_m'));
            }
            if ($request->filled('duplikat_jendela_menit')) {
                Setting::setValue(Setting::KEY_DUPLIKAT_JENDELA_MENIT, (string) $request->integer('duplikat_jendela_menit'));
            }
            flashMessage(MessageType::UPDATED->message('Pengaturan notifikasi'));
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');
        }

        return to_route('admin.settings.edit');
    }
}
