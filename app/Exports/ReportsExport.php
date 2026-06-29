<?php

namespace App\Exports;

use App\Models\Report;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

/**
 * Ekspor laporan kejadian ke berkas Excel (.xlsx) yang sudah dirapikan: ada kop/judul,
 * baris header berwarna, garis tabel, dan kolom data pelapor + linimasa penanganan
 * (jam lapor, jam direspons, jam tiba, jam selesai, waktu respons, durasi penanganan).
 *
 * Tidak ada withoutGlobalScopes() di sini - query tetap lewat scope Tenantable milik
 * Report, jadi admin hanya mengekspor laporan di wilayah tenant-nya sendiri.
 */
class ReportsExport implements FromQuery, WithColumnWidths, WithCustomStartCell, WithEvents, WithHeadings, WithMapping, WithTitle
{
    /** Baris tempat header tabel diletakkan (kop menempati baris 1-4). */
    private const HEADER_ROW = 6;

    /** Kolom terakhir yang dipakai tabel (disesuaikan dengan jumlah heading). */
    private const LAST_COLUMN = 'V';

    /** Label status agar konsisten dengan badge di halaman Verifikasi Laporan. */
    private const STATUS_LABELS = [
        'aktif' => 'Darurat Aktif (Belum Selesai)',
        'TERLAPOR' => 'Terlapor (Belum Divalidasi)',
        'pending' => 'Menunggu Respons',
        'handling' => 'Sedang Ditangani',
        'resolved' => 'Selesai',
    ];

    private int $rowNumber = 0;

    public function __construct(private readonly array $filters = []) {}

    public function query(): Builder
    {
        $status = $this->filters['status'] ?? null;

        return Report::query()
            ->with([
                'user:id,name',
                'officers:id,report_id,dispatched_at,arrived_at,finished_at',
                'helpers:id,report_id,started_at,arrived_at,finished_at',
                'province:code,name',
                'city:code,name',
                'district:code,name',
                'village:code,name',
            ])
            ->filter($this->filters)
            ->when($status && $status !== 'Semua', fn ($query) => $status === 'aktif'
                ? $query->whereIn('status', ['pending', 'handling', 'TERLAPOR'])
                : $query->where('status', $status))
            ->latest('created_at');
    }

    public function title(): string
    {
        return 'Laporan Kejadian';
    }

    public function startCell(): string
    {
        return 'A'.self::HEADER_ROW;
    }

    public function headings(): array
    {
        return [
            'No',
            'ID',
            'Tanggal & Jam Lapor',
            'Nama Pelapor',
            'No. Telepon',
            'Judul Kejadian',
            'Deskripsi',
            'Alamat Kejadian',
            'Kel./Desa',
            'Kecamatan',
            'Kab./Kota',
            'Provinsi',
            'Latitude',
            'Longitude',
            'Status',
            'Jam Direspons',
            'Jam Tiba di Lokasi',
            'Jam Selesai',
            'Waktu Respons',
            'Durasi Penanganan',
            'Jml. Petugas',
            'Jml. Relawan',
        ];
    }

    public function map($report): array
    {
        $this->rowNumber++;

        $respondedAt = $this->earliest(array_merge(
            $report->officers->pluck('dispatched_at')->all(),
            $report->helpers->pluck('started_at')->all(),
        ));
        $arrivedAt = $this->earliest(array_merge(
            $report->officers->pluck('arrived_at')->all(),
            $report->helpers->pluck('arrived_at')->all(),
        ));
        $finishedAt = $this->latest(array_merge(
            $report->officers->pluck('finished_at')->all(),
            $report->helpers->pluck('finished_at')->all(),
        ));

        return [
            $this->rowNumber,
            $report->id,
            optional($report->created_at)->format('d-m-Y H:i'),
            $report->name ?: optional($report->user)->name ?: '-',
            $report->phone ?: '-',
            $report->title,
            $report->description,
            $report->address,
            optional($report->village)->name ?: '-',
            optional($report->district)->name ?: '-',
            optional($report->city)->name ?: '-',
            optional($report->province)->name ?: '-',
            $report->lat,
            $report->lng,
            self::STATUS_LABELS[$report->status] ?? $report->status,
            optional($respondedAt)->format('d-m-Y H:i') ?: '-',
            optional($arrivedAt)->format('d-m-Y H:i') ?: '-',
            optional($finishedAt)->format('d-m-Y H:i') ?: '-',
            $this->humanDuration($report->created_at, $arrivedAt),
            $this->humanDuration($arrivedAt, $finishedAt),
            $report->officers->count(),
            $report->helpers->count(),
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 5,    // No
            'B' => 7,    // ID
            'C' => 18,   // Tgl & Jam Lapor
            'D' => 22,   // Nama Pelapor
            'E' => 16,   // Telepon
            'F' => 28,   // Judul
            'G' => 34,   // Deskripsi
            'H' => 34,   // Alamat
            'I' => 18,   // Desa
            'J' => 18,   // Kecamatan
            'K' => 18,   // Kab/Kota
            'L' => 18,   // Provinsi
            'M' => 12,   // Lat
            'N' => 12,   // Lng
            'O' => 22,   // Status
            'P' => 18,   // Jam Direspons
            'Q' => 18,   // Jam Tiba
            'R' => 18,   // Jam Selesai
            'S' => 18,   // Waktu Respons
            'T' => 18,   // Durasi Penanganan
            'U' => 11,   // Jml Petugas
            'V' => 11,   // Jml Relawan
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $last = self::LAST_COLUMN;
                $headerRow = self::HEADER_ROW;
                $firstDataRow = $headerRow + 1;
                $lastDataRow = max($firstDataRow, $headerRow + $this->rowNumber);

                // ---- Kop / Judul Dokumen ----
                $sheet->mergeCells("A1:{$last}1");
                $sheet->mergeCells("A2:{$last}2");
                $sheet->mergeCells("A3:{$last}3");
                $sheet->mergeCells("A4:{$last}4");

                $sheet->setCellValue('A1', 'PUSAT KOMANDO SISUPIT DAMKAR');
                $sheet->setCellValue('A2', 'Laporan Data Kejadian Kebakaran & Kedaruratan');
                $sheet->setCellValue('A3', $this->filterSummary());
                $sheet->setCellValue('A4', 'Dicetak pada: '.Carbon::now()->translatedFormat('d F Y H:i').' WITA');

                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
                $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(12);
                $sheet->getStyle('A3')->getFont()->setSize(10)->setItalic(true);
                $sheet->getStyle('A4')->getFont()->setSize(10)->setItalic(true);
                $sheet->getStyle("A1:{$last}4")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // ---- Baris Header Tabel ----
                $headerRange = "A{$headerRow}:{$last}{$headerRow}";
                $sheet->getStyle($headerRange)->getFont()->setBold(true)
                    ->getColor()->setARGB('FFFFFFFF');
                $sheet->getStyle($headerRange)->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setARGB('FFB91C1C'); // merah damkar
                $sheet->getStyle($headerRange)->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                    ->setVertical(Alignment::VERTICAL_CENTER)
                    ->setWrapText(true);
                $sheet->getRowDimension($headerRow)->setRowHeight(28);

                // ---- Garis & perataan area data ----
                $tableRange = "A{$headerRow}:{$last}{$lastDataRow}";
                $sheet->getStyle($tableRange)->getBorders()->getAllBorders()
                    ->setBorderStyle(Border::BORDER_THIN)
                    ->getColor()->setARGB('FFBFBFBF');

                if ($this->rowNumber > 0) {
                    $dataRange = "A{$firstDataRow}:{$last}{$lastDataRow}";
                    $sheet->getStyle($dataRange)->getAlignment()->setVertical(Alignment::VERTICAL_TOP);
                    // Kolom angka & waktu dibuat rata tengah agar rapi terbaca.
                    foreach (['A', 'B', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'] as $col) {
                        $sheet->getStyle("{$col}{$firstDataRow}:{$col}{$lastDataRow}")
                            ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    }
                    // Belang baris (zebra) untuk keterbacaan.
                    for ($row = $firstDataRow; $row <= $lastDataRow; $row++) {
                        if (($row - $firstDataRow) % 2 === 1) {
                            $sheet->getStyle("A{$row}:{$last}{$row}")->getFill()
                                ->setFillType(Fill::FILL_SOLID)
                                ->getStartColor()->setARGB('FFF5F5F5');
                        }
                    }
                }

                // Bekukan kop + header agar tetap terlihat saat di-scroll.
                $sheet->freezePane('A'.$firstDataRow);
            },
        ];
    }

    /**
     * Ringkasan filter aktif untuk ditampilkan di kop.
     */
    private function filterSummary(): string
    {
        $status = $this->filters['status'] ?? null;
        $search = $this->filters['search'] ?? null;

        $statusLabel = ($status && $status !== 'Semua')
            ? (self::STATUS_LABELS[$status] ?? $status)
            : 'Semua Status';

        $summary = 'Filter Status: '.$statusLabel;
        if (! empty($search)) {
            $summary .= '  |  Kata Kunci: "'.$search.'"';
        }

        return $summary;
    }

    /**
     * Carbon paling awal dari sekumpulan nilai tanggal (null/kosong diabaikan).
     */
    private function earliest(array $values): ?Carbon
    {
        return $this->toCarbons($values)->sort()->first();
    }

    /**
     * Carbon paling akhir dari sekumpulan nilai tanggal (null/kosong diabaikan).
     */
    private function latest(array $values): ?Carbon
    {
        return $this->toCarbons($values)->sort()->last();
    }

    /**
     * @return \Illuminate\Support\Collection<int, Carbon>
     */
    private function toCarbons(array $values): \Illuminate\Support\Collection
    {
        return collect($values)
            ->filter()
            ->map(fn ($value) => $value instanceof Carbon ? $value : Carbon::parse($value))
            ->values();
    }

    /**
     * Selisih dua waktu dalam format manusiawi (mis. "1 jam 12 menit").
     * Mengembalikan "-" bila salah satu waktu belum ada.
     */
    private function humanDuration($start, $end): string
    {
        if (! $start || ! $end) {
            return '-';
        }

        $start = $start instanceof Carbon ? $start : Carbon::parse($start);
        $end = $end instanceof Carbon ? $end : Carbon::parse($end);

        if ($end->lessThan($start)) {
            return '-';
        }

        $minutes = (int) $start->diffInMinutes($end);

        if ($minutes < 1) {
            return '< 1 menit';
        }

        $hours = intdiv($minutes, 60);
        $remaining = $minutes % 60;

        if ($hours > 0) {
            return $remaining > 0 ? "{$hours} jam {$remaining} menit" : "{$hours} jam";
        }

        return "{$remaining} menit";
    }
}
