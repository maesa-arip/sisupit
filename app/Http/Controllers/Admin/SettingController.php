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
            ],
        ]);
    }

    public function update(NotificationSettingRequest $request): RedirectResponse
    {
        try {
            Setting::setValue(Setting::KEY_NOTIFY_LEVEL_PETUGAS, $request->notify_level_petugas);
            Setting::setValue(Setting::KEY_NOTIFY_LEVEL_RELAWAN, $request->notify_level_relawan);
            flashMessage(MessageType::UPDATED->message('Pengaturan notifikasi'));
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');
        }

        return to_route('admin.settings.edit');
    }
}
