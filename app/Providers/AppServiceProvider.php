<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void {}

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Superadmin bypass semua permission secara otomatis!
        Gate::before(function ($user, $ability) {
            return $user->hasRole('superadmin') ? true : null;
        });
        Vite::prefetch(concurrency: 3);
        JsonResource::withoutWrapping();

        // Forum Tanya Jawab Warga (TASK_54). Pertanyaan dibatasi lebih ketat dari balasan:
        // tiap pertanyaan menambah antrean tinjauan admin.
        RateLimiter::for('forum-thread', function ($request) {
            return Limit::perHour(5)->by($request->user()?->id ?: $request->ip());
        });
        RateLimiter::for('forum-reply', function ($request) {
            return Limit::perHour(20)->by($request->user()?->id ?: $request->ip());
        });

        // Email Dinas (TASK_56). Batasnya longgar — surat resmi memang jarang, dan menahan
        // kiriman yang sah di tengah kejadian lebih mahal daripada risiko spam dari akun staf
        // yang identitasnya sudah diketahui. Yang menjaga penyalahgunaan di sini bukan limiter
        // melainkan daftar putih penerima (MailSendRequest).
        RateLimiter::for('mail-send', function ($request) {
            return Limit::perHour(30)->by($request->user()?->id ?: $request->ip());
        });

        if (! App::environment([
            'local',
            'testing',
        ])) {
            URL::forceScheme('https');
        }
    }
}
