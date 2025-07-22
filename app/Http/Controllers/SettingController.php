<?php

namespace App\Http\Controllers;

use App\Enums\MessageType;
use App\Http\Requests\SettingRequest;
use App\Http\Resources\SettingResource;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(): Response
    {
        $settings = Setting::query()
            ->select(['id', 'name','display_name','slug','description','amount', 'status', 'created_at'])
            // ->where('company_id',auth()->user()->companies->id)
            // ->filter(request()->only(['search']))
            // ->sorting(request()->only(['field', 'direction']))
            ->paginate(request()->load ?? 10)
            ->withQueryString();

        return inertia('Front/Settings/Index', [
            'settings' => SettingResource::collection($settings)->additional([
                'meta' => [
                    'has_pages' => $settings->hasPages(),
                ],
            ]),
            'page_settings' => [
                'title' => 'Pengaturan',
                'subtitle' => 'Menampilkan semua data pengaturan yang anda miliki pada platform ini',
            ],
            'state' => [
                'page' => request()->page ?? 1,
                'search' => request()->search ?? '',
                'load' => request()->load ?? 10,
            ],
        ]);
    }

    public function create(): Response
    {
        return inertia('Front/Settings/Create', [
            'page_settings' => [
                'title' => 'Edit Pengaturan',
                'subtitle' => 'Edit pengaturan disini. Klik simpan setelah selesai',
                'method' => 'POST',
                'action' => route('front.settings.store'),
            ],
        ]);
    }

    public function store(SettingRequest $request): RedirectResponse
    {
        try {
            Setting::updateOrCreate([
                'company_id' => auth()->user()->companies->id,
            ],
            [
                'company_id' => auth()->user()->companies->id,
                'name' => $name = $request->name,
                'slug' => str()->lower(str()->slug($name) . str()->random(4)),
                'status' => $request->status,
            ]);
            flashMessage(MessageType::CREATED->message('Perusahaan'));

            return to_route('front.companies.index');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');

            return to_route('front.companies.index');
        }
    }

    public function edit(Setting $setting): Response
    {
        return inertia('Front/Settings/Edit', [
            'page_settings' => [
                'title' => 'Edit Pengaturan',
                'subtitle' => 'Edit pengaturan disini. Klik simpan setelah selesai',
                'method' => 'PUT',
                'action' => route('front.settings.update', $setting),
            ],
            'setting' => $setting,
        ]);
    }

    public function update(Setting $setting, SettingRequest $request): RedirectResponse
    {
        try {
            $setting->update([
                'name' => $name = $request->name,
                'slug' => $name !== $setting->name ? str()->lower(str()->slug($name) . str()->random(4)) : $setting->slug,
            ]);
            flashMessage(MessageType::UPDATED->message('Pengaturan'));

            return to_route('front.settings.index');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessae()), 'error');
            return to_route('front.settings.index');
        }
    }

}
