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
        ];
    }

    public function attributes(): array
    {
        return [
            'notify_level_petugas' => 'Tingkat Siaran Petugas',
            'notify_level_relawan' => 'Tingkat Siaran Relawan',
        ];
    }
}
