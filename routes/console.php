<?php

use App\Models\FcmToken;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Sapu token FCM yang tak terlihat 270 hari (TASK_73, App\Models\FcmToken::prunable).
// Butuh cron `* * * * * php artisan schedule:run` di server.
Schedule::command('model:prune', ['--model' => [FcmToken::class]])->daily();
