<?php

namespace App\Models;

use App\Traits\Tenantable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Jejak Email Dinas yang keluar (TASK_56). APPEND-ONLY, pola TrackingLog: dibuat sekali, tak
 * pernah di-update maupun dihapus. Pertanyaan "siapa mengirim apa ke siapa" hanya bisa dijawab
 * kalau barisnya tidak bisa disunting belakangan.
 *
 * Pengirim & penerima disimpan sebagai SNAPSHOT di samping penunjuknya (`sender_name` di
 * samping `user_id`; alamat penerima di dalam `to`/`cc`, bukan foreignId ke mail_contacts) —
 * pola yang sama dengan `report_agencies.agency_name`: catatan historis tidak boleh berubah
 * saat masternya disunting atau akunnya dihapus.
 */
class MailMessage extends Model
{
    use Tenantable;

    public const STATUS_TERKIRIM = 'terkirim';

    public const STATUS_GAGAL = 'gagal';

    protected $guarded = [];

    protected $casts = [
        'to' => 'array',
        'cc' => 'array',
        'attachment_meta' => 'array',
        'sent_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    /** Ringkas `to` jadi satu baris untuk daftar: "Camat Denpasar Barat, Kadis PU". */
    public function penerimaRingkas(): string
    {
        return collect($this->to ?? [])
            ->map(fn ($penerima) => $penerima['name'] ?? $penerima['email'] ?? '')
            ->filter()
            ->join(', ');
    }

    public function scopeFilter(Builder $query, array $filters): void
    {
        $query->when($filters['search'] ?? null, function (Builder $query, $search) {
            $query->where(function (Builder $query) use ($search) {
                $query->where('subject', 'like', '%'.$search.'%')
                    ->orWhere('sender_name', 'like', '%'.$search.'%');
            });
        });
    }
}
