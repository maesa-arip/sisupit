<?php

namespace App\Http\Requests\Admin;

use App\Enums\TenantLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class NotificationSettingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'notify_level_petugas' => ['required', Rule::enum(TenantLevel::class)],
            'notify_level_relawan' => ['required', Rule::enum(TenantLevel::class)],
            'notify_level_pejabat' => ['required', Rule::enum(TenantLevel::class)],
            // TASK_55. 0 = deteksi mati. Batas atas dipagari: radius 5 km / jendela 24 jam sudah
            // menggabungkan kejadian yang jelas berbeda.
            'duplikat_radius_m' => ['nullable', 'integer', 'min:0', 'max:5000'],
            'duplikat_jendela_menit' => ['nullable', 'integer', 'min:0', 'max:1440'],
        ];
    }

    public function attributes(): array
    {
        return [
            'notify_level_petugas' => 'Tingkat Siaran Petugas',
            'notify_level_relawan' => 'Tingkat Siaran Relawan',
            'notify_level_pejabat' => 'Tingkat Siaran Pejabat',
            'duplikat_radius_m' => 'Radius Laporan Ganda',
            'duplikat_jendela_menit' => 'Jendela Waktu Laporan Ganda',
        ];
    }
}
