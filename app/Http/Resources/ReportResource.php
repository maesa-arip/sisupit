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
        $userHelper = $this->helpers->first();
        return [
            'id' => $this->id,
            'name' => $this->name,
            'title' => $this->title,
            'description' => $this->description,
            'address' => $this->address,
            'location_lat' => $this->location_lat,
            'location_lng' => $this->location_lng,
            'photo' => $this->photo ? Storage::url($this->photo) : null,
            'user' => $this->whenLoaded('user', [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
            ]),
            'created_at' => $this->created_at->format('d M Y H:i:s'),

            // Tambahan untuk status relawan
            'already_helping' => !is_null($userHelper),
            'helper_status' => $userHelper?->status, // waiting, ongoing, done
            'helpers_count' => $this->helpers_count ?? $this->helpers->count(), // fallback aman
            'helpers' => $this->whenLoaded('helpers', function () {
                return $this->helpers->map(function ($helper) {
                    return [
                        'id' => $helper->id,
                        'user' => [
                            'id' => $helper->user?->id,
                            'name' => $helper->user?->name,
                            'email' => $helper->user?->email,
                            'phone' => $helper->user?->phone,
                        ],
                        'location_lat' => $helper->location_lat,
                        'location_lng' => $helper->location_lng,
                        'created_at' => $helper->created_at->format('d M Y H:i'),
                    ];
                });
            }),
        ];
    }
}
