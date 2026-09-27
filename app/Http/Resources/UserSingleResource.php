<?php

namespace App\Http\Resources;

use App\Models\ForumThread;
use App\Models\Tenant;
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
            // Alamat TINGGAL (teks bebas, TASK_61) - terpisah dari kode wilayah akun, yang bagi
            // petugas/staf berarti wilayah TUGAS. Dibaca form Informasi Profil.
            'address' => $this->address,
            'province_code' => $this->province_code,
            'city_code' => $this->city_code,
            'district_code' => $this->district_code,
            'village_code' => $this->village_code,
            'is_standby' => $this->is_standby,
            'skills' => $this->skills ?? [],
            'avatar' => $this->avatar ? Storage::url($this->avatar) : null,
            'ktp' => $this->ktp ? Storage::url($this->ktp) : null,
            'role' => $this->getRoleNames(),
            // Menu forum hanya muncul bila forum dinyalakan untuk kabupaten akun ini (TASK_54).
            // Dibaca navItems.js; dihitung server supaya menu & gerbang route satu aturan.
            'forum_enabled' => ForumThread::enabledFor($this->resource),
            // Menu Email Dinas hanya muncul bila kabupaten akun ini punya kotak surat yang
            // sudah disetel adminnya (TASK_56). Dihitung dengan fungsi yang SAMA dengan
            // gerbang route & MailSendRequest — menu yang memakai aturannya sendiri akan
            // menyimpang dan melahirkan tautan yang selalu berakhir 404 (bentuk #94).
            'mail_enabled' => Tenant::mailboxFor($this->resource) !== null,
        ];
    }
}
