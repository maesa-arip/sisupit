<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Gerbang akses sudah di route (role:superadmin). Konsisten dgn AnnouncementRequest.
        return true;
    }

    /**
     * Normalisasi subdomain sebelum validasi: selalu huruf kecil & tanpa spasi.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('subdomain')) {
            $this->merge([
                'subdomain' => strtolower(trim((string) $this->subdomain)),
            ]);
        }
    }

    public function rules(): array
    {
        $tenantId = $this->route('tenant')?->id;

        return [
            'subdomain' => [
                'required', 'string', 'max:63',
                'regex:/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/', // label DNS valid
                'not_in:www,admin,api,mail,app,static,assets,cdn',
                Rule::unique('tenants', 'subdomain')->ignore($tenantId),
            ],
            'city_code' => [
                'required', 'string', 'max:20',
                Rule::exists('indonesia_cities', 'code'),
                Rule::unique('tenants', 'city_code')->ignore($tenantId),
            ],
            'province_code' => ['nullable', 'string', 'max:20'],
            'nama_instansi' => ['required', 'string', 'max:255'],
            'pejabat_nama' => ['nullable', 'string', 'max:255'],
            'pejabat_jabatan' => ['nullable', 'string', 'max:255'],
            'pejabat_foto' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'telepon_darurat' => ['nullable', 'string', 'max:30'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'subdomain' => 'Subdomain',
            'city_code' => 'Kabupaten/Kota',
            'province_code' => 'Provinsi',
            'nama_instansi' => 'Nama Instansi',
            'pejabat_nama' => 'Nama Pejabat',
            'pejabat_jabatan' => 'Jabatan Pejabat',
            'pejabat_foto' => 'Foto Pejabat',
            'telepon_darurat' => 'Telepon Darurat',
            'is_active' => 'Aktif',
        ];
    }
}
