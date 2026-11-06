<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route;

/**
 * #237 (laporan user 2026-11-06: "warga bisa klik meluncur"). Jalur respons lama
 * `POST helpers/create` (front.helpers.store) tak memeriksa peran, wilayah, maupun status
 * laporan - akun warga mana pun bisa mendaftarkan diri "Bersiap" di laporan siapa pun.
 * Ia dihapus; satu-satunya jalur respons adalah take-action (petugas|relawan). Tombol
 * taktis di detail laporan ikut digerbang peran yang SAMA dengan server.
 */
beforeEach(function () {
    Notification::fake();

    $reporter = User::factory()->create();
    $reporter->assignRole('warga');

    $this->report = Report::create([
        'user_id' => $reporter->id,
        'title' => 'Kebakaran rumah warga',
        'description' => 'Api membesar di dapur',
        'address' => 'Jl. Pemogan No. 1',
        'lat' => '-8.6500',
        'lng' => '115.2200',
        'status' => 'pending',
        'village_code' => '5171012006',
    ]);
});

it('no longer exposes the legacy helpers/create response route', function () {
    expect(Route::has('front.helpers.store'))->toBeFalse();

    $warga = User::factory()->create(['village_code' => '5171012006']);
    $warga->assignRole('warga');

    $this->actingAs($warga)->post('/helpers/create', [
        'report_id' => $this->report->id,
        'location_lat' => '-8.6500',
        'location_lng' => '115.2200',
    ]);

    expect(DB::table('report_helpers')->where('user_id', $warga->id)->exists())->toBeFalse();
});

it('rejects take-action from warga and admin without a responder role', function () {
    foreach (['warga', 'admin'] as $role) {
        $user = User::factory()->create(['village_code' => '5171012006']);
        $user->assignRole($role);

        $this->actingAs($user)->post("/reports/{$this->report->id}/take-action")->assertForbidden();
    }

    expect(DB::table('report_helpers')->count() + DB::table('report_officers')->count())->toBe(0);
});

it('gates the tactical buttons on the same responder roles as the server', function () {
    $show = file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx'));

    expect($show)->toContain("const canRespond = userRoles.some((r) => ['petugas', 'relawan'].includes(r));")
        ->and($show)->toContain('{!canRespond ? null : !myRecord && myRegu?.i_stay ? (');

    $controller = file_get_contents(app_path('Http/Controllers/ReportActionController.php'));
    expect($controller)->toContain("hasAnyRole(['petugas', 'relawan'])");

    foreach (['VolunteerAction.jsx', 'HelpConfirmAlertDialog.jsx'] as $dead) {
        expect(file_exists(resource_path("js/Components/{$dead}")))->toBeFalse();
    }
});
