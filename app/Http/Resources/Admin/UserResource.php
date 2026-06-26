<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => $this->avatar ? Storage::url($this->avatar) : null,
            'gender' => $this->gender,
            'date_of_birth' => $this->date_of_birth?->format('d M Y'),
            'address' => $this->address,
            'created_at' => $this->created_at->format('d M Y'),
            'roles' => $this->roles->pluck('name'),
            'region' => $this->village?->name ?? $this->district?->name ?? $this->city?->name ?? $this->province?->name ?? 'Nasional',
            // Rank wilayah terdalam (desa=4 … provinsi=1, 0 jika tanpa wilayah) — dipakai
            // dialog penetapan peran untuk membatasi tingkat yurisdiksi yang bisa dipilih.
            'region_level' => $this->village_code ? 4 : ($this->district_code ? 3 : ($this->city_code ? 2 : ($this->province_code ? 1 : 0))),
        ];
    }
}
