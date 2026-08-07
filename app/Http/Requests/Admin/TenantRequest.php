<?php

namespace App\Http\Requests\Admin;

use App\Enums\TenantEdition;
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

        // Paket layanan boleh tidak dikirim (mis. pemanggil lama / skrip): anggap SEWA,
        // sama dengan default kolomnya. Tenant lama tidak berubah perilaku (TASK_19).
        if (! $this->filled('edition')) {
            $this->merge([
                'edition' => TenantEdition::SEWA->value,
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
            'email_kontak' => ['nullable', 'email', 'max:255'],
            'alamat_instansi' => ['nullable', 'string', 'max:255'],
            'penanggung_jawab_data' => ['nullable', 'string', 'max:255'],
            'edition' => ['required', Rule::enum(TenantEdition::class)],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', 'max:50'],
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
            'email_kontak' => 'Email Kontak Resmi',
            'alamat_instansi' => 'Alamat Instansi',
            'penanggung_jawab_data' => 'Penanggung Jawab Data',
            'edition' => 'Paket Layanan',
            'features' => 'Fitur Aktif',
            'is_active' => 'Aktif',
        ];
    }
}
