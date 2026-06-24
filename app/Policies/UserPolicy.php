<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Superadmin bypass is already handled globally via Gate::before
     * in AppServiceProvider. Here we only need to scope an "admin"
     * to the geographic jurisdiction (desa/kecamatan/kabupaten/provinsi)
     * they were assigned, mirroring User::scopeIsAdmin().
     */
    public function view(User $admin, User $target): bool
    {
        return $this->withinJurisdiction($admin, $target);
    }

    public function update(User $admin, User $target): bool
    {
        return $this->withinJurisdiction($admin, $target);
    }

    public function delete(User $admin, User $target): bool
    {
        return $this->withinJurisdiction($admin, $target);
    }

    private function withinJurisdiction(User $admin, User $target): bool
    {
        if ($admin->village_code) {
            return $target->village_code === $admin->village_code;
        }

        if ($admin->district_code) {
            return $target->district_code === $admin->district_code;
        }

        if ($admin->city_code) {
            return $target->city_code === $admin->city_code;
        }

        if ($admin->province_code) {
            return $target->province_code === $admin->province_code;
        }

        // Admin tanpa wilayah yang ditetapkan dianggap belum dikonfigurasi - tolak demi keamanan.
        return false;
    }
}
