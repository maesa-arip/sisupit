<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Pertanyaan baru di Forum Tanya Jawab Warga (TASK_54). Wilayah & status TIDAK diterima dari sini. */
class ForumThreadRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Gerbang fitur & wilayah dicek di ForumController.
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'title' => trim((string) $this->title),
            'body' => trim((string) $this->body),
        ]);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:10', 'max:150'],
            'body' => ['required', 'string', 'min:10', 'max:3000'],
        ];
    }

    public function attributes(): array
    {
        return [
            'title' => 'Judul pertanyaan',
            'body' => 'Isi pertanyaan',
        ];
    }
}
