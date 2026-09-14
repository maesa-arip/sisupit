<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Balasan forum (TASK_54). `is_official` TIDAK diterima dari sini - ditentukan server dari peran. */
class ForumPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['body' => trim((string) $this->body)]);
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:2', 'max:3000'],
        ];
    }

    public function attributes(): array
    {
        return ['body' => 'Balasan'];
    }
}
