<?php

use App\Models\User;

function makeCompleteCitizen(array $attributes = []): User
{
    $user = User::factory()->create(array_merge([
        'phone' => '081234500000',
        'village_code' => '5171012006',
    ], $attributes));
    $user->assignRole('masyarakat');

    return $user;
}

it('blocks a user from assigning the relawan role to someone else', function () {
    $attacker = makeCompleteCitizen();
    $victim = makeCompleteCitizen();

    $this->actingAs($attacker)
        ->put("/users/relawan/{$victim->id}")
        ->assertForbidden();

    expect($victim->refresh()->hasRole('relawan'))->toBeFalse();
});

it('lets a user assign the relawan role to themselves', function () {
    $user = makeCompleteCitizen();

    $this->actingAs($user)
        ->put("/users/relawan/{$user->id}")
        ->assertRedirect();

    expect($user->refresh()->hasRole('relawan'))->toBeTrue();
});

it('blocks a user from overwriting someone else profile detail', function () {
    $attacker = makeCompleteCitizen();
    $victim = makeCompleteCitizen(['name' => 'Original Name', 'phone' => '081111111111']);

    $this->actingAs($attacker)
        ->put("/users/detail/{$victim->id}", [
            'name' => 'Hijacked Name',
            'email' => $victim->email,
            'phone' => '089999999999',
        ])
        ->assertForbidden();

    $victim->refresh();
    expect($victim->name)->toBe('Original Name');
    expect($victim->phone)->toBe('081111111111');
});

it('lets a user update their own profile detail', function () {
    $user = makeCompleteCitizen(['name' => 'Original Name']);

    $this->actingAs($user)
        ->put("/users/detail/{$user->id}", [
            'name' => 'Updated Name',
            'email' => $user->email,
            'phone' => '081234567890',
        ])
        ->assertRedirect();

    expect($user->refresh()->name)->toBe('Updated Name');
});
