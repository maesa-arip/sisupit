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
 *
 * ISI DISELARASKAN 2026-08-26 (permintaan user): berkas ini tertinggal jauh dari data yang
 * sebenarnya dikumpulkan aplikasi. Yang diperbaiki:
 *  - Label status memakai KAMUS KANONIK yang sama dengan layar (Laporan Masuk / Laporan
 *    Terverifikasi / Penanganan / Selesai) - sebelumnya berbunyi "Terlapor (Belum
 *    Divalidasi)"/"Menunggu Respons"/"Sedang Ditangani", sehingga satu laporan punya dua
 *    nama antara layar dan berkas ekspor.
 *  - Status `ditolak` (ada sejak FINDINGS #24) TIDAK punya label sama sekali di sini, jadi
 *    selnya tercetak "ditolak" mentah. Alasan penolakannya pun tak pernah ikut terekspor.
 *  - Kolom `incident_type` (TASK_27), OPD terkait + konfirmasinya (TASK_27), armada yang
 *    dikerahkan (TASK_09), jumlah foto (FINDINGS #17), dan ringkasan Berita Acara
 *    (FINDINGS #39) belum pernah ada di sini padahal semuanya sudah lama terisi.
 *
 * SENGAJA TIDAK diekspor: identitas korban & berkas KTP di berita acara (`report_victims`,
 * disk privat) - yang ikut hanya JUMLAH korban. Berkas xlsx gampang berpindah tangan,
 * sementara KTP di aplikasi ini dijaga gerbang baca tersendiri (ReportResolutionController::ktp).
 * Kronologi & tim atensi juga tidak ikut: teks panjang bebas yang merusak lebar kolom dan
 * memang tempatnya di dokumen berita acara, bukan di rekap.
 */
class ReportsExport implements FromQuery, WithColumnWidths, WithCustomStartCell, WithEvents, WithHeadings, WithMapping, WithTitle
{
    /** Baris tempat header tabel diletakkan (kop menempati baris 1-4). */
    private const HEADER_ROW = 6;

    /** Kolom terakhir yang dipakai tabel (disesuaikan dengan jumlah heading). */
    private const LAST_COLUMN = 'AI';

    /**
     * Label status. WAJIB seiring dengan kamus kanonik di layar
     * (`resources/js/Pages/Admin/Reports/Index.jsx` → STATUS_META): kalau berbeda, satu
     * laporan punya dua nama - satu di halaman Verifikasi, satu di berkas yang dikirim ke
     * pimpinan. 'aktif' bukan status baris, melainkan nilai filter; ia hanya dipakai di kop.
     */
    private const STATUS_LABELS = [
        'aktif' => 'Darurat Aktif (Belum Selesai)',
        'TERLAPOR' => 'Laporan Masuk',
        'pending' => 'Laporan Terverifikasi',
        'handling' => 'Penanganan',
        'resolved' => 'Selesai',
        'ditolak' => 'Ditolak',
    ];

    /**
     * Label jenis kejadian, seiring dengan INCIDENT_TYPES di
     * `resources/js/Pages/Front/Reports/Create.jsx` (tombol pilihan cepat warga).
     */
    private const INCIDENT_TYPE_LABELS = [
        'rumah' => 'Kebakaran Rumah',
        'toko' => 'Kebakaran Toko/Bangunan',
        'kendaraan' => 'Kebakaran Kendaraan',
        'lahan' => 'Kebakaran Lahan',
        'lainnya' => 'Bukan Kebakaran',
    ];

    private int $rowNumber = 0;

    public function __construct(private readonly array $filters = []) {}

    public function query(): Builder
    {
        $status = $this->filters['status'] ?? null;

        return Report::query()
            ->with([
                'user:id,name',
                // Penutup & penolak insiden (FINDINGS #88) - hanya nama. Baris lama yang
                // ditutup sebelum kolomnya ada mengirim null dan tercetak "-".
                'resolver:id,name',
                'rejector:id,name',
                'officers:id,report_id,dispatched_at,arrived_at,finished_at',
                'helpers:id,report_id,started_at,arrived_at,finished_at',
                'province:code,name',
                'city:code,name',
                'district:code,name',
                'village:code,name',
                // Nama instansi diambil dari kolom `agency_name` di pivot (sengaja
                // didenormalisasi saat pelibatan) supaya rekap lama tetap terbaca apa adanya
                // walau master OPD-nya kemudian diganti nama atau dihapus.
                'reportAgencies',
                // withTrashed: armada yang kemudian dihapus dari master TIDAK boleh menghapus
                // jejak bahwa ia pernah dikerahkan - rekap ini dokumen historis. (Scope
                // Tenantable milik Unit sengaja dibiarkan: nama armada dibaca dengan
                // wewenang yang sama seperti di layar.)
                'reportUnits.unit' => fn ($query) => $query->withTrashed()->select('id', 'name'),
                'resolutions:id,report_id,status,kerugian,created_at',
                'resolutions.victims:id,report_resolution_id',
                'photos:id,report_id',
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
            'No. Laporan',
            'Tanggal & Jam Lapor',
            'Jenis Kejadian',
            'Judul Kejadian',
            'Deskripsi',
            'Nama Pelapor',
            'No. Telepon',
            'Alamat Kejadian',
            'Kel./Desa',
            'Kecamatan',
            'Kab./Kota',
            'Provinsi',
            'Latitude',
            'Longitude',
            'Status',
            'Alasan Ditolak',
            'Ditolak Oleh',
            'Jam Direspons',
            'Jam Tiba di Lokasi',
            'Jam Selesai',
            'Ditutup Oleh',
            'Waktu Ditutup',
            'Waktu Respons',
            'Durasi Penanganan',
            'Jml. Petugas',
            'Jml. Relawan',
            'Armada Dikerahkan',
            'OPD Terkait',
            'Konfirmasi OPD',
            'Jml. Foto',
            'Berita Acara',
            'Taksiran Kerugian',
            'Jml. Korban',
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

        // Berita acara boleh berkali-kali disimpan sebagai 'sementara' sebelum 'final'
        // (append-only, FINDINGS #39). Yang mewakili laporan adalah yang FINAL; kalau belum
        // ada, ambil draf terbaru supaya angkanya tetap terlihat sebagai "sementara".
        $resolution = $report->resolutions->firstWhere('status', 'final')
            ?? $report->resolutions->sortByDesc('created_at')->first();

        return [
            $this->rowNumber,
            $report->id,
            $this->reportNumber($report),
            optional($report->created_at)->format('d-m-Y H:i'),
            self::INCIDENT_TYPE_LABELS[$report->incident_type] ?? '-',
            $report->title,
            $report->description,
            $report->name ?: optional($report->user)->name ?: '-',
            $report->phone ?: '-',
            $report->address,
            optional($report->village)->name ?: '-',
            optional($report->district)->name ?: '-',
            optional($report->city)->name ?: '-',
            optional($report->province)->name ?: '-',
            $report->lat,
            $report->lng,
            self::STATUS_LABELS[$report->status] ?? $report->status,
            $this->rejectionSummary($report),
            optional($report->rejector)->name ?: '-',
            optional($respondedAt)->format('d-m-Y H:i') ?: '-',
            optional($arrivedAt)->format('d-m-Y H:i') ?: '-',
            optional($finishedAt)->format('d-m-Y H:i') ?: '-',
            // "Ditutup Oleh"/"Waktu Ditutup" BUKAN pengulangan "Jam Selesai" di sebelahnya:
            // yang itu diturunkan dari finished_at responder terakhir, dua kolom ini adalah
            // saat Pusat Komando menyatakan insiden ditutup - keduanya bisa berjarak jauh.
            optional($report->resolver)->name ?: '-',
            optional($report->resolved_at)->format('d-m-Y H:i') ?: '-',
            $this->humanDuration($report->created_at, $arrivedAt),
            $this->humanDuration($arrivedAt, $finishedAt),
            $report->officers->count(),
            $report->helpers->count(),
            $report->reportUnits->map(fn ($row) => optional($row->unit)->name)->filter()->implode(', ') ?: '-',
            $report->reportAgencies->pluck('agency_name')->filter()->implode(', ') ?: '-',
            $this->agencyConfirmationSummary($report),
            // Laporan lama menyimpan satu foto di kolom `reports.photo`; galeri
            // `report_photos` baru ada sejak FINDINGS #17. Tanpa cadangan ini laporan lama
            // tercatat 0 foto padahal fotonya ada.
            $report->photos->count() ?: ($report->photo ? 1 : 0),
            $this->resolutionLabel($report),
            optional($resolution)->kerugian ?: '-',
            $resolution ? $resolution->victims->count() : 0,
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 5,    // No
            'B' => 7,    // ID
            'C' => 16,   // No. Laporan
            'D' => 18,   // Tgl & Jam Lapor
            'E' => 20,   // Jenis Kejadian
            'F' => 28,   // Judul
            'G' => 34,   // Deskripsi
            'H' => 22,   // Nama Pelapor
            'I' => 16,   // Telepon
            'J' => 34,   // Alamat
            'K' => 18,   // Desa
            'L' => 18,   // Kecamatan
            'M' => 18,   // Kab/Kota
            'N' => 18,   // Provinsi
            'O' => 12,   // Lat
            'P' => 12,   // Lng
            'Q' => 22,   // Status
            'R' => 30,   // Alasan Ditolak
            'S' => 22,   // Ditolak Oleh
            'T' => 18,   // Jam Direspons
            'U' => 18,   // Jam Tiba
            'V' => 18,   // Jam Selesai
            'W' => 22,   // Ditutup Oleh
            'X' => 18,   // Waktu Ditutup
            'Y' => 18,   // Waktu Respons
            'Z' => 18,   // Durasi Penanganan
            'AA' => 11,  // Jml Petugas
            'AB' => 11,  // Jml Relawan
            'AC' => 26,  // Armada Dikerahkan
            'AD' => 26,  // OPD Terkait
            'AE' => 34,  // Konfirmasi OPD
            'AF' => 9,   // Jml Foto
            'AG' => 16,  // Berita Acara
            'AH' => 18,  // Taksiran Kerugian
            'AI' => 11,  // Jml Korban
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
                    $centered = ['A', 'B', 'C', 'D', 'O', 'P', 'Q', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'AC', 'AD', 'AE', 'AF'];
                    foreach ($centered as $col) {
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
     * Nomor laporan yang dilihat pengguna di layar (LP-2026-00042).
     *
     * Nomor ini TIDAK disimpan di database - ia turunan dari `id` + tahun `created_at`,
     * rumus yang sama dengan `reportNumber()` di `resources/js/lib/utils.js`. Kalau salah
     * satu diubah, yang lain harus ikut, kalau tidak nomor di kertas berbeda dengan nomor
     * di layar untuk laporan yang sama. Kolom `ID` mentah tetap ada di sebelahnya karena
     * itulah yang dipakai URL detail (/reports/show/{id}) saat ditelusuri kembali.
     */
    private function reportNumber($report): string
    {
        $year = optional($report->created_at)->format('Y') ?: Carbon::now()->format('Y');

        return 'LP-'.$year.'-'.str_pad((string) $report->id, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Alasan penolakan + kapan ditolak. Hanya terisi untuk status `ditolak`; laporan yang
     * ditolak TANPA alasan tertulis (kolomnya memang nullable) tetap menyebut waktunya.
     */
    private function rejectionSummary($report): string
    {
        if ($report->status !== 'ditolak') {
            return '-';
        }

        $reason = trim((string) $report->rejected_reason) ?: 'Tanpa alasan tertulis';
        $at = $report->rejected_at ? Carbon::parse($report->rejected_at)->format('d-m-Y H:i') : null;

        return $at ? $reason.' ('.$at.')' : $reason;
    }

    /**
     * Ringkasan konfirmasi OPD (TASK_27), mis. "PLN: sudah - 26-08-2026 12:30".
     *
     * Hanya instansi yang MEMANG butuh konfirmasi yang dihitung: `requires_confirmation`
     * adalah DATA di master OPD, bukan daftar nama instansi yang di-hardcode - jangan
     * ganti dengan pengecekan semacam `agency_name === 'PLN'`.
     */
    private function agencyConfirmationSummary($report): string
    {
        $rows = $report->reportAgencies->filter(fn ($row) => (bool) $row->requires_confirmation);

        if ($rows->isEmpty()) {
            return '-';
        }

        return $rows->map(function ($row) {
            $label = $row->agency_name ?: 'OPD';

            if (! $row->confirmed_at) {
                return $label.': menunggu';
            }

            return $label.': sudah - '.Carbon::parse($row->confirmed_at)->format('d-m-Y H:i');
        })->implode('; ');
    }

    /**
     * Status berita acara/Laporan Kegiatan Penyelamatan (FINDINGS #39) untuk satu laporan.
     */
    private function resolutionLabel($report): string
    {
        if ($report->resolutions->firstWhere('status', 'final')) {
            return 'Final';
        }

        return $report->resolutions->isNotEmpty() ? 'Sementara' : 'Belum ada';
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
