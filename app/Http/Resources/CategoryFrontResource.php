<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CategoryFrontResource extends JsonResource
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
            'slug' => $this->slug,
            // 'description'=>$this->description,
            'cover' => $this->cover ? Storage::url($this->cover) : null,
            'created_at' => $this->created_at->format('d M Y'),
            'books' => BookFrontResource::collection($this->whenLoaded('books')),
        ];
    }
}
