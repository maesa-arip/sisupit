<?php

namespace App\Models;

use App\Http\Controllers\ReportController;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Panggilan suara Pusat Komando -> pelapor lewat Sisupit (TASK_90). Semua aturan panggilan ada di
 * sini (siapa boleh menelepon, kapan berdering dianggap tak diangkat, nama channel tamu, kredensial
 * TURN) - controller & layar membacanya, jangan menyalinnya.
 *
 * Alur (offer dibuat di depan supaya pelapor cukup satu langkah): pemanggil membuat offer lengkap
 * (ICE dikumpulkan dulu, tanpa trickle) -> baris `ringing` -> pelapor Terima & mengirim answer ->
 * `answered` -> pemanggil memasang answer, suara tersambung (`connected_at`) -> salah satu Akhiri
 * -> `ended`. Tiap perubahan = aba-aba ReporterCallChanged; isinya diambil lewat HTTP.
 */
class ReporterCall extends Model
{
    public const STATUS_RINGING = 'ringing';

    public const STATUS_ANSWERED = 'answered';

    public const STATUS_ENDED = 'ended';

    /** Berdering lebih lama dari ini = tak diangkat (layar pemanggil menyerah di 45 dtk). */
    public const RING_TIMEOUT_SECONDS = 60;

    /** Sudah dijawab tapi suara tak kunjung tersambung lebih lama dari ini = gagal. */
    public const CONNECT_TIMEOUT_SECONDS = 60;

    /** Alasan berakhir -> label layar (riwayat panggilan di detail laporan). */
    public const END_REASONS = [
        'completed' => 'Selesai',
        'declined' => 'Ditolak pelapor',
        'no_answer' => 'Tidak diangkat',
        'cancelled' => 'Dibatalkan',
        'no_mic' => 'Mikrofon pelapor tidak tersedia',
        'failed' => 'Gagal tersambung',
    ];

    protected $guarded = [];

    protected $hidden = ['offer_sdp', 'answer_sdp'];

    protected function casts(): array
    {
        return [
            'answered_at' => 'datetime',
            'connected_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class)->withoutGlobalScopes();
    }

    public function caller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'caller_id');
    }

    /**
     * Boleh `$user` menelepon pelapor `$report` lewat Sisupit? SATU rumus untuk tombol di layar
     * (prop `canCallReporter`) dan gerbang start() - tombol yang tampil tanpa gerbangnya = 403.
     *
     * Pemanggil = Pusat Komando di wilayah laporan (orang yang sama yang melihat nomor & tombol
     * Telepon/WhatsApp). Pelapor harus bisa dicapai: tamu (lewat halaman statusnya) atau akun
     * yang BUKAN Pusat Komando - laporan yang diketik operator dari telepon ber-user_id operator
     * itu sendiri, jadi "menelepon pelapor" di sana berarti menelepon operatornya.
     */
    public static function canCall(User $user, Report $report): bool
    {
        if (! $user->hasAnyRole(ReportController::COMMAND_CENTER_ROLES) || ! $user->withinReportJurisdiction($report)) {
            return false;
        }
        if ($report->status === Report::STATUS_DIGABUNG) {
            return false;
        }

        if ($report->user_id === null) {
            return $report->guest_check !== null;
        }
        if ($report->user_id === $user->id) {
            return false;
        }

        $reporter = User::find($report->user_id);

        return $reporter !== null && ! $reporter->hasAnyRole(ReportController::COMMAND_CENTER_ROLES);
    }

    /** Panggilan yang masih berjalan untuk laporan ini (sesudah menutup yang kedaluwarsa). */
    public static function activeForReport(int $reportId): ?self
    {
        $call = self::where('report_id', $reportId)
            ->whereIn('status', [self::STATUS_RINGING, self::STATUS_ANSWERED])
            ->latest('id')
            ->first();

        if ($call && $call->expireIfStale()) {
            return null;
        }

        return $call;
    }

    /** Panggilan MASUK yang sedang berdering untuk akun ini (shared prop `incomingCall`). */
    public static function ringingFor(User $user): ?self
    {
        $call = self::where('callee_user_id', $user->id)
            ->where('status', self::STATUS_RINGING)
            ->latest('id')
            ->first();

        if ($call && $call->expireIfStale()) {
            return null;
        }

        return $call;
    }

    /**
     * Nama channel PUBLIK tempat halaman status tamu mendengar aba-aba panggilan. Tamu tak bisa
     * diotorisasi di channel privat, jadi kerahasiaannya dari nama: HMAC id laporan dengan APP_KEY,
     * hanya pernah dikirim ke halaman yang dibuka lewat tautan status bertanda tangan. Isi siarannya
     * aba-aba (id + status) - SDP tetap diambil lewat route bertanda tangan.
     */
    public static function guestChannel(int $reportId): string
    {
        return 'reporter-call.'.substr(hash_hmac('sha256', 'reporter-call:'.$reportId, (string) config('app.key')), 0, 40);
    }

    /**
     * Server ICE untuk RTCPeerConnection. TURN (coturn `use-auth-secret`) diberi kredensial
     * sementara - username `kedaluwarsa:pengenal`, password HMAC-SHA1 rahasia bersama - jadi
     * rahasianya tak pernah sampai ke browser. Tanpa TURN, panggilan di balik CGNAT seluler
     * sebagian gagal tersambung (TASK_90 §coturn).
     */
    public static function iceServers(string $peer): array
    {
        $servers = [];

        $stun = array_values(array_filter(array_map('trim', explode(',', (string) config('services.webrtc.stun_urls')))));
        if ($stun) {
            $servers[] = ['urls' => $stun];
        }

        $turn = array_values(array_filter(array_map('trim', explode(',', (string) config('services.webrtc.turn_urls')))));
        $secret = (string) config('services.webrtc.turn_secret');
        if ($turn && $secret !== '') {
            $username = (now()->timestamp + (int) config('services.webrtc.turn_ttl', 3600)).':'.$peer;
            $servers[] = [
                'urls' => $turn,
                'username' => $username,
                'credential' => base64_encode(hash_hmac('sha1', $username, $secret, true)),
            ];
        }

        return $servers;
    }

    public function isActive(): bool
    {
        return $this->status !== self::STATUS_ENDED;
    }

    /**
     * Tutup panggilan yang menggantung (pemanggil menutup tab sebelum menyerah, pelapor tak pernah
     * membuka aplikasinya). Dipanggil setiap kali baris dibaca, jadi tak butuh penjadwal.
     */
    public function expireIfStale(): bool
    {
        $reason = null;
        if ($this->status === self::STATUS_RINGING && $this->created_at->lt(now()->subSeconds(self::RING_TIMEOUT_SECONDS))) {
            $reason = 'no_answer';
        } elseif ($this->status === self::STATUS_ANSWERED && ! $this->connected_at
            && $this->answered_at?->lt(now()->subSeconds(self::CONNECT_TIMEOUT_SECONDS))) {
            $reason = 'failed';
        }

        if (! $reason) {
            return false;
        }

        $this->end($reason, 'system');

        return true;
    }

    /** Akhiri panggilan (sekali saja - panggilan yang sudah berakhir tak ditimpa alasannya). */
    public function end(string $reason, string $by): void
    {
        if ($this->status === self::STATUS_ENDED) {
            return;
        }

        // Yang sudah tersambung lalu ditutup/terputus = selesai, apa pun tombol yang ditekan:
        // "Gagal tersambung" pada percakapan yang sempat berjalan menyesatkan riwayatnya.
        if ($this->connected_at) {
            $reason = 'completed';
        }

        $this->update([
            'status' => self::STATUS_ENDED,
            'end_reason' => array_key_exists($reason, self::END_REASONS) ? $reason : 'failed',
            'ended_by' => $by,
            'ended_at' => now(),
        ]);
    }

    public function durationSeconds(): ?int
    {
        return $this->connected_at && $this->ended_at
            ? max(0, (int) $this->connected_at->diffInSeconds($this->ended_at))
            : null;
    }

    /** Baris riwayat panggilan untuk halaman detail (Pusat Komando). */
    public function toLogRow(): array
    {
        return [
            'id' => $this->id,
            'created_at' => $this->created_at,
            'caller_name' => $this->caller_name,
            'status' => $this->status,
            'end_reason' => $this->end_reason,
            'end_label' => $this->end_reason ? self::END_REASONS[$this->end_reason] ?? null : null,
            'duration_seconds' => $this->durationSeconds(),
        ];
    }
}
