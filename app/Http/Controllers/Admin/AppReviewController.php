<?php

namespace App\Http\Controllers\Admin;

use App\Exports\AppReviewsExport;
use App\Http\Controllers\Controller;
use App\Models\AppReview;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Ulasan aplikasi untuk tim (TASK_86). Route bergerbang role:admin|superadmin.
 *
 * Wilayah dipegang Tenantable pada AppReview (province_code + city_code penulis, pola forum):
 * admin kabupaten hanya melihat & menyetujui ulasan kabupatennya, superadmin semuanya. Route
 * model binding ikut membawa global scope itu, jadi id dari kabupaten lain = 404.
 * Ringkasan angka TIDAK menghitung ulasan akun demo (TASK_81); daftarnya tetap menampilkannya
 * dengan lencana supaya tidak tampak hilang.
 */
class AppReviewController extends Controller
{
    public const RANGE_OPTIONS = ['30', '90', '365', 'semua'];

    public const TABS = ['semua', 'testimoni', 'disembunyikan'];

    public function index(Request $request): Response
    {
        $filters = $this->filters($request);
        $tab = in_array($request->query('tab'), self::TABS, true) ? $request->query('tab') : 'semua';

        $summaryBase = $this->filtered($filters)->where('is_demo', false);
        $distribution = (clone $summaryBase)->selectRaw('rating, COUNT(*) as total')->groupBy('rating')->pluck('total', 'rating');
        $total = (int) $distribution->sum();

        $reviews = $this->applyTab($this->filtered($filters), $tab)
            ->with(['user:id,name', 'hider:id,name'])
            ->latest('updated_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (AppReview $review) => [
                'id' => $review->id,
                'rating' => $review->rating,
                'tags' => collect($review->tags ?? [])->map(fn ($tag) => AppReview::TAGS[$tag] ?? $tag)->values(),
                'comment' => $review->comment,
                'user_name' => $review->user?->name ?? 'Pengguna',
                'public_name' => AppReview::publicName($review->user?->name),
                'role' => $review->role,
                'platform' => $review->platform,
                'hidden_at' => $review->hidden_at,
                'hider' => $review->hider?->name,
                'is_demo' => $review->is_demo,
                'updated_at' => $review->updated_at,
            ]);

        return inertia('Admin/AppReviews/Index', [
            'reviews' => $reviews,
            'filters' => [...$filters, 'tab' => $tab],
            'summary' => [
                'total' => $total,
                'average' => $total ? round((clone $summaryBase)->avg('rating'), 1) : null,
                'distribution' => collect(range(5, 1))->map(fn ($star) => [
                    'rating' => $star,
                    'total' => (int) ($distribution[$star] ?? 0),
                ])->all(),
                'by_platform' => (clone $summaryBase)
                    ->selectRaw('platform, COUNT(*) as total, AVG(rating) as average')
                    ->groupBy('platform')->get()
                    ->map(fn ($row) => [
                        'platform' => $row->platform,
                        'total' => (int) $row->total,
                        'average' => round((float) $row->average, 1),
                    ])->all(),
            ],
            'counts' => [
                'testimoni' => $this->applyTab($this->filtered($filters), 'testimoni')->count(),
                'disembunyikan' => $this->applyTab($this->filtered($filters), 'disembunyikan')->count(),
            ],
            'options' => [
                'platforms' => collect(AppReview::PLATFORMS)->map(fn ($label, $key) => ['value' => $key, 'label' => $label])->values(),
                'roles' => array_keys(AppReview::ROLES),
                'ranges' => self::RANGE_OPTIONS,
            ],
        ]);
    }

    /**
     * Sembunyikan / tampilkan lagi sebuah ulasan di halaman depan. Ulasan tampil otomatis
     * (2026-11-21), jadi satu-satunya keputusan admin adalah menyembunyikannya.
     */
    public function togglePublish(Request $request, AppReview $appReview): RedirectResponse
    {
        if ($appReview->hidden_at) {
            abort_if($appReview->is_demo, 422, 'Ulasan akun demo tidak tampil sebagai testimoni.');

            $appReview->update(['hidden_at' => null, 'hidden_by' => null]);
            flashMessage('Ulasan kembali tampil sebagai testimoni.');

            return back();
        }

        $appReview->update(['hidden_at' => now(), 'hidden_by' => $request->user()->id]);
        flashMessage('Ulasan disembunyikan dari halaman depan.');

        return back();
    }

    public function export(Request $request): BinaryFileResponse
    {
        $filters = $this->filters($request);

        return Excel::download(
            new AppReviewsExport($this->filtered($filters)->with('user:id,name')->latest('updated_at')),
            'ulasan-aplikasi-'.now(config('app.local_timezone'))->format('Ymd-Hi').'.xlsx'
        );
    }

    /** Nilai filter dari query string; nilai asing dibuang (pola Report::normalizeListFilters). */
    private function filters(Request $request): array
    {
        $rating = (string) $request->query('rating', '');
        $platform = (string) $request->query('platform', '');
        $role = (string) $request->query('role', '');
        $range = (string) $request->query('range', 'semua');

        return [
            'rating' => in_array($rating, ['1', '2', '3', '4', '5'], true) ? $rating : '',
            'platform' => array_key_exists($platform, AppReview::PLATFORMS) ? $platform : '',
            'role' => array_key_exists($role, AppReview::ROLES) ? $role : '',
            'range' => in_array($range, self::RANGE_OPTIONS, true) ? $range : 'semua',
        ];
    }

    private function filtered(array $filters): Builder
    {
        return AppReview::query()
            ->when($filters['rating'] !== '', fn ($q) => $q->where('rating', (int) $filters['rating']))
            ->when($filters['platform'] !== '', fn ($q) => $q->where('platform', $filters['platform']))
            ->when($filters['role'] !== '', fn ($q) => $q->where('role', $filters['role']))
            ->when($filters['range'] !== 'semua', fn ($q) => $q->where('updated_at', '>=', now()->subDays((int) $filters['range'])));
    }

    private function applyTab(Builder $query, string $tab): Builder
    {
        return match ($tab) {
            'testimoni' => $query->published(),
            'disembunyikan' => $query->whereNotNull('hidden_at'),
            default => $query,
        };
    }
}
