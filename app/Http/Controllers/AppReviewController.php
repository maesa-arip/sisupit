<?php

namespace App\Http\Controllers;

use App\Models\AppReview;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Ulasan aplikasi oleh penggunanya sendiri (TASK_86). Route di grup auth+verified: tamu tidak
 * bisa mengulas (keputusan user), semua peran boleh. Pengguna hanya pernah menyentuh ulasannya
 * SENDIRI - tak ada id di URL, barisnya dicari dari user_id akun yang masuk.
 */
class AppReviewController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'tags' => ['nullable', 'array', 'max:'.count(AppReview::TAGS)],
            'tags.*' => ['string', 'distinct', Rule::in(array_keys(AppReview::TAGS))],
            'comment' => ['nullable', 'string', 'max:'.AppReview::COMMENT_MAX],
            'allow_public' => ['boolean'],
        ], [
            'rating.required' => 'Pilih jumlah bintang terlebih dahulu.',
            'rating.between' => 'Pilih jumlah bintang terlebih dahulu.',
            'comment.max' => 'Komentar maksimal '.AppReview::COMMENT_MAX.' karakter.',
        ]);

        $user = $request->user();
        $comment = trim((string) ($data['comment'] ?? '')) ?: null;
        $allowPublic = (bool) ($data['allow_public'] ?? false);
        $existing = AppReview::ownedBy($user);

        // Persetujuan admin melekat pada TEKS yang ia baca. Komentar berubah atau izin dicabut =
        // testimoni turun dan (bila masih diizinkan) kembali menunggu tinjauan.
        $keepApproval = $existing
            && $existing->approved_at
            && $allowPublic
            && $existing->comment === $comment;

        $values = [
            'rating' => $data['rating'],
            'tags' => array_values($data['tags'] ?? []) ?: null,
            'comment' => $comment,
            'allow_public' => $allowPublic,
            'platform' => AppReview::platformFrom($request),
            'role' => AppReview::roleOf($user),
            'province_code' => $user->province_code,
            'city_code' => $user->city_code,
            'is_demo' => (bool) $user->is_demo,
            'approved_at' => $keepApproval ? $existing->approved_at : null,
            'approved_by' => $keepApproval ? $existing->approved_by : null,
        ];

        if ($existing) {
            $existing->update($values);
        } else {
            AppReview::create(['user_id' => $user->id, ...$values]);
        }

        flashMessage($existing ? 'Ulasan Anda diperbarui. Terima kasih!' : 'Terima kasih atas ulasan Anda!');

        return back();
    }

    /** "Nanti saja" (tunda AppReview::SNOOZE_DAYS hari) atau "Jangan tanya lagi" (`never`). */
    public function dismiss(Request $request): RedirectResponse
    {
        $data = $request->validate(['never' => ['boolean']]);
        $userId = $request->user()->id;
        $never = (bool) ($data['never'] ?? false);

        $existing = DB::table('app_review_prompts')->where('user_id', $userId)->first();
        $values = [
            'dismissed_at' => now(),
            // Sekali "jangan tanya lagi", "nanti saja" berikutnya tak membatalkannya.
            'never_ask' => $never || (bool) ($existing->never_ask ?? false),
            'updated_at' => now(),
        ];

        if ($existing) {
            DB::table('app_review_prompts')->where('user_id', $userId)->update($values);
        } else {
            DB::table('app_review_prompts')->insert(['user_id' => $userId, 'created_at' => now(), ...$values]);
        }

        return back();
    }
}
