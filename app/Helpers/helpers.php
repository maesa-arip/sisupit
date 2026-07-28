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
