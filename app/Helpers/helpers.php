<?php

use App\Models\User;

if (! function_exists('flashMessage')) {
    function flashMessage($message, $type = 'success'): void
    {
        session()->flash('message', $message);
        session()->flash('type', $type);
    }
}

if (! function_exists('currentTenant')) {
    // Tenant "wajah publik" yang sudah di-resolve ResolveTenant (dari subdomain), atau
    // Tenant::default() (Denpasar) bila belum ter-bind (mis. CLI/console). Lihat TASK_17.
    function currentTenant(): \App\Models\Tenant
    {
        return app()->bound('currentTenant') ? app('currentTenant') : \App\Models\Tenant::default();
    }
}

if (! function_exists('isNativeApp')) {
    // Request datang dari wrapper Android/iOS: UA-nya wajib memuat token 'SisupitApp'
    // (mobile/KONTRAK.md §1). Dipakai untuk kebijakan sesi aplikasi (TASK_73): di aplikasi,
    // login selalu "ingat saya" - sesi web 120 menit tak cocok untuk HP yang menerima sirine.
    function isNativeApp(?\Illuminate\Http\Request $request = null): bool
    {
        return str_contains(($request ?? request())->userAgent() ?? '', 'SisupitApp');
    }
}

if (! function_exists('usernameGenerator')) {
    function usernameGenerator(string $name): string
    {
        $username = strtolower(preg_replace('/\s+/', '_', trim($name)));
        $original_username = $username;
        $count = 1;

        while (User::where('username', $username)->exists()) {
            $username = $original_username.$count;
            $count++;
        }

        return $username;
    }
}
