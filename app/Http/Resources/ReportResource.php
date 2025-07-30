<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ReportResource extends JsonResource
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
            'title' => $this->title,
            'description' => $this->description,
            'address' => $this->address,
            'location_lat' => $this->location_lat,
            'location_lng' => $this->location_lng,
            'photo' => $this->photo ? Storage::url($this->photo) : null,
            'created_at' => $this->created_at->format('d M Y H:i:s'),
        ];
    }
}
