<?php

use App\Models\Report;
use App\Models\ReportResolution;
use App\Models\User;

// #243 (2026-11-15): taksiran kerugian = RENTANG ANGKA rupiah, bukan teks "±1jt", karena kolom
// Excel-nya dipakai rumus. Teks lama tetap terbaca untuk berita acara lama.

beforeEach(function () {
    $reporter = User::factory()->create();
    $reporter->assignRole('warga');

    $this->report = Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran gudang',
        'address' => 'Jl. Trengguli No. 50',
        'lat' => '-8.6300',
        'lng' => '115.2600',
        'status' => 'resolved',
        'province_code' => '51',
        'village_code' => '5171012006',
    ]);

    $this->petugas = User::factory()->create(['village_code' => '5171012006']);
    $this->petugas->assignRole('petugas');
});

it('stores the loss estimate as a numeric range and drops the old free text', function () {
    ReportResolution::create([
        'report_id' => $this->report->id, 'created_by' => $this->petugas->id, 'status' => 'sementara', 'kerugian' => '±1jt',
    ]);

    $this->actingAs($this->petugas)
        ->post("/reports/{$this->report->id}/resolution", [
            'status' => 'sementara',
            'kerugian' => '±1jt',
            'kerugian_min' => '1000000',
            'kerugian_maks' => '5000000',
        ])
        ->assertRedirect(route('reports.show', $this->report->id));

    $row = ReportResolution::where('report_id', $this->report->id)->sole();

    expect($row->kerugian_min)->toBe(1000000)
        ->and($row->kerugian_maks)->toBe(5000000)
        // Dua taksiran berbeda tak boleh tersimpan berdampingan.
        ->and($row->kerugian)->toBeNull()
        ->and($row->kerugianLabel())->toBe('Rp 1.000.000 - Rp 5.000.000');
});

it('rejects an upper bound below the lower bound', function () {
    $this->actingAs($this->petugas)
        ->post("/reports/{$this->report->id}/resolution", [
            'status' => 'sementara',
            'kerugian_min' => '5000000',
            'kerugian_maks' => '1000000',
        ])
        ->assertSessionHasErrors('kerugian_maks');

    expect(ReportResolution::where('report_id', $this->report->id)->exists())->toBeFalse();
});

it('rejects non-numeric loss values', function () {
    $this->actingAs($this->petugas)
        ->post("/reports/{$this->report->id}/resolution", ['status' => 'sementara', 'kerugian_min' => '±1jt'])
        ->assertSessionHasErrors('kerugian_min');
});

it('keeps the old free text readable when no range is filled', function () {
    $row = new ReportResolution(['kerugian' => 'kurang lebih 50 juta']);
    expect($row->kerugianLabel())->toBe('kurang lebih 50 juta');

    expect((new ReportResolution(['kerugian_min' => 2000000, 'kerugian_maks' => 2000000]))->kerugianLabel())->toBe('Rp 2.000.000')
        ->and((new ReportResolution(['kerugian_min' => 2000000]))->kerugianLabel())->toBe('Minimal Rp 2.000.000')
        ->and((new ReportResolution)->kerugianLabel())->toBeNull();
});

it('exports min and max as numbers in AH and AI for spreadsheet formulas', function () {
    $admin = User::factory()->create(['province_code' => '51']);
    $admin->assignRole('admin');

    ReportResolution::create([
        'report_id' => $this->report->id, 'created_by' => $admin->id, 'status' => 'final',
        'kerugian_min' => 1500000, 'kerugian_maks' => 7500000,
    ]);

    $response = $this->actingAs($admin)->get('/admin/reports/export');
    $sheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($response->baseResponse->getFile()->getPathname())->getActiveSheet();

    expect($sheet->getCell('AH6')->getValue())->toBe('Taksiran Kerugian Min (Rp)')
        ->and($sheet->getCell('AI6')->getValue())->toBe('Taksiran Kerugian Maks (Rp)')
        ->and($sheet->getCell('AH7')->getValue())->toBe(1500000)
        ->and($sheet->getCell('AI7')->getValue())->toBe(7500000)
        ->and($sheet->getCell('AH7')->getDataType())->toBe(\PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_NUMERIC);
});
