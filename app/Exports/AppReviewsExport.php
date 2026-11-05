<?php

namespace App\Exports;

use App\Models\AppReview;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

/**
 * Ekspor ulasan aplikasi (TASK_86). Query datang dari Admin\AppReviewController dengan filter yang
 * sama dengan layar dan TETAP lewat Tenantable - admin hanya mengekspor ulasan wilayahnya.
 * Nama yang dicetak = nama akun (data internal tim, sama dengan layar admin).
 */
class AppReviewsExport implements FromQuery, ShouldAutoSize, WithHeadings, WithMapping, WithTitle
{
    public function __construct(private Builder $query) {}

    public function query(): Builder
    {
        return $this->query;
    }

    public function title(): string
    {
        return 'Ulasan Aplikasi';
    }

    public function headings(): array
    {
        return ['Tanggal (WITA)', 'Nama', 'Peran', 'Platform', 'Bintang', 'Tag', 'Komentar', 'Testimoni', 'Akun Demo'];
    }

    public function map($review): array
    {
        return [
            $review->updated_at?->timezone(config('app.local_timezone'))->format('d/m/Y H:i'),
            $review->user?->name ?? 'Pengguna',
            AppReview::ROLES[$review->role] ?? '-',
            AppReview::PLATFORMS[$review->platform] ?? $review->platform,
            $review->rating,
            collect($review->tags ?? [])->map(fn ($tag) => AppReview::TAGS[$tag] ?? $tag)->implode(', '),
            $review->comment,
            $review->approved_at ? 'Tampil' : ($review->allow_public ? 'Diizinkan, belum ditinjau' : 'Tidak diizinkan'),
            $review->is_demo ? 'Ya' : '',
        ];
    }
}
