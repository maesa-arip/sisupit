<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReportHelperRequest extends FormRequest
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
            'report_id' => [
                'required',
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'location_lat' => 'Lattitude',
            'location_lng' => 'Longitude',
            'report_id' => 'Laporan',
        ];
    }
}
