<?php

namespace App\Exports;

use App\Models\Report;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ReportsExport implements FromQuery, WithHeadings, WithMapping
{
    public function __construct(private readonly array $filters = [])
    {
    }

    /**
     * Tidak ada withoutGlobalScopes() di sini - query tetap lewat scope Tenantable
     * milik Report, jadi admin hanya mengekspor laporan di wilayah tenant-nya sendiri.
     */
    public function query(): Builder
    {
        $status = $this->filters['status'] ?? null;

        return Report::query()
            ->with('user:id,name')
            ->filter($this->filters)
            ->when($status && $status !== 'Semua', fn ($query) => $query->where('status', $status))
            ->latest('created_at');
    }

    public function headings(): array
    {
        return [
            'ID',
            'Judul Kejadian',
            'Nama Pelapor',
            'Telepon',
            'Status',
            'Alamat',
            'Latitude',
            'Longitude',
            'Dilaporkan Pada',
        ];
    }

    public function map($report): array
    {
        return [
            $report->id,
            $report->title,
            $report->name,
            $report->phone,
            $report->status,
            $report->address,
            $report->lat,
            $report->lng,
            optional($report->created_at)->format('d-m-Y H:i'),
        ];
    }
}
