<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class PublisherRequest extends FormRequest
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
                'required',
                'min:3',
                'max:255',
                'string',
            ],
            'address' => [
                'nullable',
                'max:255',
                'string',
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
                'string',
            ],
            'phone' => [
                'nullable',
                'max:15',
            ],
            'logo' => [
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
            'address' => 'Alamat',
            'email' => 'Email',
            'phone' => 'Nomor Handphone',
            'logo' => 'Logo',
        ];
    }
}
