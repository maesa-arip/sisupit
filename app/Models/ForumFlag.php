<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/** Laporan warga atas sebuah pertanyaan/balasan forum (TASK_54). */
class ForumFlag extends Model
{
    /**
     * Alasan laporan. Labelnya ikut dikirim server ke layar supaya kamus ini tak ditulis
     * dua kali (pelajaran #94).
     */
    public const REASONS = [
        'hoaks' => 'Informasi keliru / hoaks',
        'kasar' => 'Kasar atau menyerang',
        'spam' => 'Spam / promosi',
        'data_pribadi' => 'Menyebar data pribadi',
        'darurat' => 'Kejadian darurat (seharusnya dilaporkan)',
        'lainnya' => 'Lainnya',
    ];

    protected $guarded = [];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public static function reasonOptions(): array
    {
        return collect(self::REASONS)->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values()->all();
    }

    public function flaggable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
