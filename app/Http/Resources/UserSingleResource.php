<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UserSingleResource extends JsonResource
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
            'email' => $this->email,
            'phone' => $this->phone,
            'province_code' => $this->province_code,
            'city_code' => $this->city_code,
            'district_code' => $this->district_code,
            'village_code' => $this->village_code,
            'is_standby' => $this->is_standby,
            'avatar' => $this->avatar ? Storage::url($this->avatar) : null,
            'ktp' => $this->ktp ? Storage::url($this->ktp) : null,
            'role' => $this->getRoleNames(),
        ];
    }
}
