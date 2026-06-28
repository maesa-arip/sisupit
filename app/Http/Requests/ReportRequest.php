<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReportRequest extends FormRequest
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
        // Lokasi & wilayah hanya wajib saat MEMBUAT laporan (POST). Saat edit (PUT) lokasi
        // tidak diubah (lihat keputusan #30: edit konten + foto saja), jadi dibuat opsional.
        $isCreate = $this->isMethod('POST');

        return [
            'name' => [
                'nullable',
                'max:255',
                'string',
            ],
            'phone' => [
                'nullable',
                'max:15',
            ],
            'province_code' => [
                $isCreate ? 'required' : 'nullable',
                'exists:indonesia_provinces,code',
            ],
            'city_code' => [
                $isCreate ? 'required' : 'nullable',
                'exists:indonesia_cities,code',
            ],
            'district_code' => [
                $isCreate ? 'required' : 'nullable',
                'exists:indonesia_districts,code',
            ],
            'village_code' => [
                $isCreate ? 'required' : 'nullable',
                'exists:indonesia_villages,code',
            ],
            'title' => [
                'required',
                'min:3',
                'max:255',
                'string',
            ],
            'description' => [
                'required',
                'min:3',
                'max:255',
                'string',
            ],
            'lat' => [
                $isCreate ? 'required' : 'nullable',
                'min:3',
                'max:255',
            ],
            'lng' => [
                $isCreate ? 'required' : 'nullable',
                'min:3',
                'max:255',
            ],
            'address' => [
                'required',
                'min:3',
                'max:255',
                'string',
            ],
            // Galeri foto (FINDINGS #17). Wajib minimal satu saat membuat laporan (POST);
            // pada update (PUT) opsional. Kolom `photo` lama dipertahankan sebagai sampul.
            'photos' => [
                $this->isMethod('POST') ? 'required' : 'nullable',
                'array',
                'max:6',
            ],
            'photos.*' => [
                'image',
                'mimes:png,jpg,jpeg,webp',
                'max:4096',
            ],
            // Id foto galeri yang dihapus saat edit (lihat ReportController::update).
            'removed_photos' => [
                'nullable',
                'array',
            ],
            'removed_photos.*' => [
                'integer',
            ],
            'photo' => [
                'nullable',
                'mimes:png,jpg,jpeg,webp',
                'max:4096',
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'Nama',
            'phone' => 'Nomor Handphone',
            'title' => 'Judul',
            'description' => 'Deskripsi',
            'province_code' => 'Provinsi',
            'city_code' => 'Kota',
            'district_code' => 'Kecamatan',
            'village_code' => 'Desa',
            'lat' => 'Lattitude',
            'lng' => 'Longitude',
            'address' => 'Alamat',
            'photo' => 'Photo',
            'photos' => 'Foto',
            'photos.*' => 'Foto',
        ];
    }
}
