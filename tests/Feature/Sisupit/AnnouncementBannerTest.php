<?php

use App\Models\Announcement;
use App\Models\User;

/**
 * #184 - Pengumuman Sistem dulu pita `fixed bottom-0` tanpa z-index: di ponsel tertutup
 * MobileBottomNav (z-50) sehingga tak pernah terbaca, di desktop melayang menutupi isi.
 *
 * ATURAN: Banner = kartu di alur halaman (di dalam area konten AppLayout), bukan fixed/sticky.
 */
function bannerSourceWithoutComments(string $path): string
{
    return preg_replace(['~/\*.*?\*/~s', '~^\s*//.*$~m', '~\{/\*.*?\*/\}~s'], '', file_get_contents(resource_path($path)));
}

it('renders the announcement banner in the page flow, never fixed or sticky', function () {
    $banner = bannerSourceWithoutComments('js/Components/Banner.jsx');

    expect($banner)
        ->not->toMatch('/\bfixed\b/')
        ->not->toMatch('/\bsticky\b/')
        ->toContain('aria-label="Tutup pengumuman"');
});

it('mounts the banner inside the content area of AppLayout', function () {
    $layout = bannerSourceWithoutComments('js/Layouts/AppLayout.jsx');

    $content = strpos($layout, 'ref={contentRef}');
    $banner = strpos($layout, '<Banner announcement={announcemet}');

    expect($content)->not->toBeFalse()
        ->and($banner)->not->toBeFalse()
        ->and($banner)->toBeGreaterThan($content);
});

it('lists active announcements first with a correctly spelled status', function () {
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    Announcement::create(['message' => 'Lama tidak aktif', 'url' => null, 'is_active' => false]);
    Announcement::create(['message' => 'Aktif', 'url' => null, 'is_active' => true]);

    $this->actingAs($superadmin)->get('/admin/announcements')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('announcements.data.0.message', 'Aktif')
            ->where('announcements.data.1.is_active', 'Tidak Aktif'));
});
