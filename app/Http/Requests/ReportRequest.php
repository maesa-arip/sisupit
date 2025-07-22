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
            'title' => [
                'nullable',
                'min:3',
                'max:255',
                'string',
            ],
            'description' => [
                'nullable',
                'min:3',
                'max:255',
                'string',
            ],
            'location_lat' => [
                'required',
                'min:3',
                'max:255',
            ],
            'location_lng' => [
                'required',
                'min:3',
                'max:255',
            ],
            'address' => [
                'nullable',
                'max:255',
                'string',
            ],
            'photo' => [
                'nullable',
                'mimes:png,jpg,jpeg,webp',
                'max:2048',
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
            'location_lat' => 'Lattitude',
            'location_lng' => 'Longitude',
            'address' => 'Alamat',
            'photo' => 'Photo',
        ];
    }
}
