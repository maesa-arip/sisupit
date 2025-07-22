<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        // $this->call(CategorySeeder::class);
        $this->call(PublisherSeeder::class);

        User::factory()->create([
            'name' => $name = 'Maesa',
            'username' => usernameGenerator($name),
            'email' => 'maesa@example.com',
        ])->assignRole(Role::create(['name' => 'admin']));

        User::factory()->create([
            'name' => $name = 'Ari',
            'username' => usernameGenerator($name),
            'email' => 'ari@example.com',
        ])->assignRole(Role::create(['name' => 'operator']));

        User::factory()->create([
            'name' => $name = 'Palguna',
            'username' => usernameGenerator($name),
            'email' => 'palguna@example.com',
        ])->assignRole(Role::create(['name' => 'member']));
    }
}
