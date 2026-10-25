<?php

/**
 * #220 - komputer operator di Damkar (aplikasi desktop Sisupit) disambungkan ke speaker
 * ruangan. Server sengaja tidak mengirim sirine ke admin (ReportActionController::approve
 * hanya menyiarkan ke petugas/relawan/pejabat dan membuang akun penekan tombol), jadi sirine
 * di komputer itu dipicu halaman Detail Insiden lewat jembatan `window.sisupitDesktop`.
 *
 * ATURAN yang dijaga:
 *  - jembatan dipanggil di onSuccess Broadcast (bukan saat tombol diklik: approve yang
 *    ditolak, mis. laporan sudah diproses, tidak boleh membunyikan speaker);
 *  - pemanggilannya opsional (`?.`) supaya browser & APK, yang tak punya jembatan, tak error.
 */
it('rings the desktop speaker only after a successful broadcast', function () {
    $show = file_get_contents(resource_path('js/Pages/Front/Reports/Show.jsx'));

    $start = strpos($show, 'const executeApprove = () => {');
    $end = strpos($show, 'onFinish: () => setIsProcessing(false),', $start);
    $approve = substr($show, $start, $end - $start);

    expect($start)->not->toBeFalse()
        ->and(substr_count($show, 'sisupitDesktop'))->toBe(1)
        ->and($approve)->toMatch("/onSuccess: \\(\\) => \\{[^}]*toast\\.success\\('Sinyal darurat disiarkan!'\\);[^}]*window\\.sisupitDesktop\\?\\.sirineBroadcast\\?\\.\\(report\\.id\\);/s");
});

it('never sends the dispatch siren to the admin who broadcasts', function () {
    $controller = file_get_contents(app_path('Http/Controllers/ReportActionController.php'));

    // Kalau suatu saat admin ikut menerima sirine dari server, speaker Damkar akan berbunyi
    // DUA KALI (push + jembatan) - jembatan di Show.jsx harus ditinjau ulang bersamaan.
    expect($controller)->toContain('->reject(fn (User $u) => $u->id === auth()->id())');
});
