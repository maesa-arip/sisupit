<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Balasan di Forum Tanya Jawab Warga (TASK_54).
 *
 * TIDAK memakai Tenantable dan tak menyimpan kode wilayah: wilayahnya milik thread induk.
 * Karena itu setiap endpoint yang menerima ForumPost lewat route binding WAJIB memastikan
 * thread induknya terlihat oleh akun itu (ForumThread ber-Tenantable) - binding ForumPost
 * sendiri tidak menyaring apa pun.
 */
class ForumPost extends Model
{
    use SoftDeletes;

    public const STATUS_TAMPIL = 'tampil';

    public const STATUS_DISEMBUNYIKAN = 'disembunyikan';

    protected $guarded = [];

    protected $casts = [
        'is_official' => 'boolean',
        'moderated_at' => 'datetime',
    ];

    public function thread(): BelongsTo
    {
        return $this->belongsTo(ForumThread::class, 'forum_thread_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function flags(): MorphMany
    {
        return $this->morphMany(ForumFlag::class, 'flaggable');
    }
}
