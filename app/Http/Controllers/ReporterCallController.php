<?php

namespace App\Http\Controllers;

use App\Events\ReportRecordChanged;
use App\Events\ReporterCallChanged;
use App\Models\Report;
use App\Models\ReporterCall;
use App\Models\Tenant;
use App\Models\User;
use App\Notifications\ReporterCallNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;

/**
 * Panggilan suara Pusat Komando -> pelapor lewat Sisupit (TASK_90, tahap 1: web). Endpoint JSON
 * polos (pola updateLocation/geocode). Sinyal WebRTC lewat server: offer & answer disimpan di
 * `reporter_calls`, siaran hanya aba-aba (ReporterCallChanged).
 *
 * Gerbang: pemanggil = ReporterCall::canCall (satu rumus dengan tombol); pihak lain = PESERTA
 * panggilan itu sendiri - akun pelapor (callee_user_id), atau tamu yang memegang tautan status
 * bertanda tangan laporan itu (route `signed:relative`, pola guestStatus).
 */
class ReporterCallController extends Controller
{
    private const SDP_MAX = 20000;

    /** Pusat Komando memulai panggilan. Offer sudah lengkap (ICE dikumpulkan di klien). */
    public function start(Request $request, $reportId): JsonResponse
    {
        // Bypass Tenantable; re-check = canCall (wilayah + peran) di bawah (ATURAN EMAS #7).
        $report = Report::withoutGlobalScopes()->findOrFail($reportId);
        $user = $request->user();
        abort_unless(ReporterCall::canCall($user, $report), 403, 'Anda tidak bisa menelepon pelapor laporan ini.');

        $data = $request->validate(['offer_sdp' => ['required', 'string', 'max:'.self::SDP_MAX]]);

        // Satu panggilan per laporan: dua operator yang menelepon bersamaan membuat HP pelapor
        // berdering dua kali dan salah satunya pasti terputus tanpa sebab yang terlihat.
        if ($active = ReporterCall::activeForReport($report->id)) {
            return response()->json([
                'message' => 'Pelapor sedang ditelepon'.($active->caller_name ? ' oleh '.$active->caller_name : '').'.',
            ], 409);
        }

        $call = ReporterCall::create([
            'report_id' => $report->id,
            'caller_id' => $user->id,
            'caller_name' => $user->name,
            'callee_user_id' => $report->user_id,
            'status' => ReporterCall::STATUS_RINGING,
            'offer_sdp' => $data['offer_sdp'],
        ]);

        $this->announce($call, true);

        // Pelapor ber-akun yang aplikasinya tertutup: push biasa (bukan sirine). Tamu tak punya
        // jalur push - ia hanya berdering bila halaman statusnya sedang terbuka.
        if ($report->user_id && ($reporter = User::find($report->user_id))) {
            try {
                $reporter->notify(new ReporterCallNotification($report));
            } catch (Throwable $e) {
                report($e);
            }
        }

        return response()->json(['call' => $this->callerPayload($call)], 201);
    }

    /** Server ICE untuk pemanggil - hanya Pusat Komando (peran yang sama dengan canCall). */
    public function ice(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(ReportController::COMMAND_CENTER_ROLES), 403);

        return response()->json(['ice_servers' => ReporterCall::iceServers('c'.$user->id)]);
    }

    /** Keadaan panggilan untuk pesertanya (dibaca saat aba-aba datang + polling cadangan). */
    public function state(Request $request, ReporterCall $call): JsonResponse
    {
        $side = $this->sideOf($call, $request->user());
        $call->expireIfStale();

        return response()->json(['call' => $side === 'caller' ? $this->callerPayload($call) : $this->calleePayload($call)]);
    }

    public function answer(Request $request, ReporterCall $call): JsonResponse
    {
        abort_unless($this->sideOf($call, $request->user()) === 'callee', 403);

        return $this->doAnswer($request, $call);
    }

    /** Pemanggil melapor suara sudah tersambung - awal hitungan durasi. */
    public function connected(Request $request, ReporterCall $call): JsonResponse
    {
        abort_unless($this->sideOf($call, $request->user()) === 'caller', 403);

        if ($call->status === ReporterCall::STATUS_ANSWERED && ! $call->connected_at) {
            $call->update(['connected_at' => now()]);
        }

        return response()->json(['call' => $this->callerPayload($call)]);
    }

    public function end(Request $request, ReporterCall $call): JsonResponse
    {
        $side = $this->sideOf($call, $request->user());

        return $this->doEnd($request, $call, $side);
    }

    // ---- Pelapor TAMU (tautan status bertanda tangan) ---------------------------------------

    public function guestState(Request $request, $reportId): JsonResponse
    {
        $call = $this->guestActiveCall($reportId);

        return response()->json(['call' => $call ? $this->calleePayload($call) : null]);
    }

    public function guestAnswer(Request $request, $reportId): JsonResponse
    {
        return $this->doAnswer($request, $this->guestCallFromBody($request, $reportId));
    }

    public function guestEnd(Request $request, $reportId): JsonResponse
    {
        return $this->doEnd($request, $this->guestCallFromBody($request, $reportId), 'callee');
    }

    // ---- bersama ----------------------------------------------------------------------------

    private function doAnswer(Request $request, ReporterCall $call): JsonResponse
    {
        $data = $request->validate(['answer_sdp' => ['required', 'string', 'max:'.self::SDP_MAX]]);

        $call->expireIfStale();
        if ($call->status !== ReporterCall::STATUS_RINGING) {
            return response()->json(['message' => 'Panggilan sudah berakhir.', 'call' => $this->calleePayload($call)], 409);
        }

        $call->update([
            'status' => ReporterCall::STATUS_ANSWERED,
            'answer_sdp' => $data['answer_sdp'],
            'answered_at' => now(),
        ]);
        $this->announce($call);

        return response()->json(['call' => $this->calleePayload($call)]);
    }

    private function doEnd(Request $request, ReporterCall $call, string $side): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', Rule::in(array_keys(ReporterCall::END_REASONS))]]);

        if ($call->isActive()) {
            $call->end($data['reason'], $side);
            $this->announce($call, true);
        }

        return response()->json(['call' => $side === 'caller' ? $this->callerPayload($call) : $this->calleePayload($call)]);
    }

    /** caller | callee - selain peserta panggilan = 403. */
    private function sideOf(ReporterCall $call, User $user): string
    {
        if ($call->caller_id === $user->id) {
            return 'caller';
        }
        if ($call->callee_user_id !== null && $call->callee_user_id === $user->id) {
            return 'callee';
        }

        abort(403, 'Anda bukan peserta panggilan ini.');
    }

    /** Tanda tangan URL sudah membuktikan pemegang tautan status laporan ini (middleware). */
    private function guestActiveCall($reportId): ?ReporterCall
    {
        $report = Report::withoutGlobalScopes()->select('id', 'user_id')->findOrFail($reportId);
        if ($report->user_id !== null) {
            // Laporan sudah diklaim ke akun: panggilan kini berdering di akunnya, bukan di tautan.
            return null;
        }

        $call = ReporterCall::activeForReport($report->id);

        return $call && $call->callee_user_id === null ? $call : null;
    }

    private function guestCallFromBody(Request $request, $reportId): ReporterCall
    {
        $id = $request->validate(['call_id' => ['required', 'integer']])['call_id'];

        return ReporterCall::where('id', $id)
            ->where('report_id', (int) $reportId)
            ->whereNull('callee_user_id')
            ->firstOrFail();
    }

    /** Aba-aba ke kedua peserta (+ riwayat panggilan di detail laporan bila `$record`). */
    private function announce(ReporterCall $call, bool $record = false): void
    {
        try {
            broadcast(new ReporterCallChanged($call));
            if ($record) {
                // Tulisan ke catatan insiden wajib punya aba-abanya (#113): riwayat panggilan.
                broadcast(new ReportRecordChanged($call->report_id));
            }
        } catch (Throwable $e) {
            // Polling cadangan di klien tetap membawa keadaan terbaru bila Reverb sedang mati.
            report($e);
        }
    }

    private function callerPayload(ReporterCall $call): array
    {
        return [
            'id' => $call->id,
            'side' => 'caller',
            'report_id' => $call->report_id,
            // Lambang kota di layar panggilan hanya bila asetnya ada (Denpasar) - CallOverlay.
            'city_code' => $call->report?->city_code,
            'status' => $call->status,
            'end_reason' => $call->end_reason,
            'end_label' => $call->end_reason ? ReporterCall::END_REASONS[$call->end_reason] ?? null : null,
            'answer_sdp' => $call->status === ReporterCall::STATUS_ANSWERED ? $call->answer_sdp : null,
            'connected_at' => $call->connected_at,
        ];
    }

    /**
     * Yang dilihat pelapor: siapa yang menelepon disebut INSTANSInya, bukan nama operator, plus
     * nomor Damkar untuk telepon balik bila mikrofonnya tak bisa dipakai (APK lama tanpa izin
     * mikrofon - TASK_90 §APK).
     */
    private function calleePayload(ReporterCall $call): array
    {
        $report = $call->report;
        $tenant = $report ? Tenant::forCity($report->city_code) : null;

        return [
            'id' => $call->id,
            'side' => 'callee',
            'report_id' => $call->report_id,
            'report_number' => $report ? Report::nomorLaporan($report) : null,
            'city_code' => $report?->city_code,
            'status' => $call->status,
            'end_reason' => $call->end_reason,
            'offer_sdp' => $call->status === ReporterCall::STATUS_RINGING ? $call->offer_sdp : null,
            'caller_label' => $tenant?->nama_instansi ?: 'Pusat Komando Damkar',
            'callback_phone' => $tenant?->telepon_darurat ?: '113',
            'ice_servers' => ReporterCall::iceServers('p'.$call->id),
        ];
    }
}
