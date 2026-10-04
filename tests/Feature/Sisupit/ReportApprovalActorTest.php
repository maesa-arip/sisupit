<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\Notification;

/**
 * Jejak verifikasi (kolom reports.approved_at/approved_by, TASK_72). Dashboard TASK_72 dikembalikan
 * ke tampilan sebelumnya (2026-10-05), tetapi kolom & penulisannya di approve() adalah DATA dan
 * migrasinya sudah jalan di produksi - karena itu test ini dipertahankan dari AdminCommandCenterTest.
 */
function ccReport(array $attrs = [], ?string $createdAt = null): Report
{
    $reporter = User::factory()->create(['city_code' => $attrs['city_code'] ?? '5171']);

    $report = Report::withoutGlobalScopes()->create(array_merge([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran rumah',
        'description' => 'Asap tebal',
        'address' => 'Jl. Test',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'TERLAPOR',
        'province_code' => '51',
        'city_code' => '5171',
    ], $attrs));

    if ($createdAt) {
        $report->forceFill(['created_at' => $createdAt])->save();
    }

    return $report;
}

function ccAdmin(): User
{
    $admin = User::factory()->create(['province_code' => '51', 'city_code' => '5171']);
    $admin->assignRole('admin');

    return $admin;
}

it('records who verified a report and when', function () {
    Notification::fake();
    $admin = ccAdmin();
    $report = ccReport();

    $this->actingAs($admin)->post(route('reports.approve', $report->id))->assertRedirect();

    $report->refresh();
    expect($report->status)->toBe('pending')
        ->and($report->approved_by)->toBe($admin->id)
        ->and($report->approved_at)->not->toBeNull();
});
