<?php

// FINDINGS #227 - live tracking di halaman detail insiden (Show.jsx), sisi layar.
// Penjaga sumber (pola LeafletFitBoundsTest/ReguTest): perilaku ini hidup di effect React yang
// tak terjangkau test PHP, dan kedua kemunduran di bawah tak memunculkan galat apa pun.

function showSourceTanpaKomentar(): string
{
    return preg_replace(
        ['~/\*.*?\*/~s', '~^\s*//.*$~m'],
        '',
        file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx')),
    );
}

// Dulu tiap tik watchPosition (bisa tiap detik) = satu POST update-location + satu baris
// tracking_logs + satu siaran; prod 2026-10-27 mencatat 2.280 baris untuk satu petugas.
it('throttles web location pings like the APK service (5 s and 10 m)', function () {
    $source = showSourceTanpaKomentar();

    expect($source)->toContain('const TRACKING_MIN_INTERVAL_MS = 5000;')
        ->and($source)->toContain('const TRACKING_MIN_DISTANCE_M = 10;');

    $start = strpos($source, 'navigator.geolocation.watchPosition(');
    expect($start)->not->toBeFalse();
    $block = substr($source, $start, strpos($source, 'clearWatch', $start) - $start);

    $gate = strpos($block, 'TRACKING_MIN_INTERVAL_MS');
    $post = strpos($block, '/update-location');
    expect($gate)->not->toBeFalse()
        ->and($post)->not->toBeFalse()
        ->and($gate)->toBeLessThan($post)
        ->and($block)->toContain('TRACKING_MIN_DISTANCE_M');
});

// Dulu langganan channel menumpang di effect peta yang bergantung pada officerList: tiap posisi
// masuk = Echo.leave + subscribe ulang + POST /broadcasting/auth, dan posisi selama celah hilang.
it('subscribes to the incident channel in an effect keyed on the report id only', function () {
    $source = showSourceTanpaKomentar();

    expect(substr_count($source, 'window.Echo.private('))->toBe(1);

    $start = strpos($source, 'window.Echo.private(');
    $deps = strpos($source, '}, [', $start);
    preg_match('/\}, \[([^\]]*)\]\);/', substr($source, $deps, 80), $m);
    expect(trim($m[1]))->toBe('report.id');

    // Effect peta (yang memang bergantung pada officerList) tak lagi menyentuh Echo.
    $map = strpos($source, 'officerList.forEach((o) => {');
    $mapEnd = strpos($source, '}, [', $map);
    expect(substr($source, $map, $mapEnd - $map))->not->toContain('Echo');

    foreach (['ResponderLocationUpdated', 'IncidentLocationCorrected', 'ResponderRosterChanged', 'ReportRecordChanged', 'ReportStatusChanged'] as $event) {
        expect($source)->toContain("channel.listen('{$event}'");
    }
});
