<?php

use App\Http\Controllers\Auth\SocialiteController;

it('assigns the masyarakat role (not relawan) to a brand new oauth user', function () {
    $socialUser = new class
    {
        public function getId()
        {
            return 'google-123';
        }

        public function getEmail()
        {
            return 'oauth-user@example.com';
        }

        public function getName()
        {
            return 'Oauth User';
        }

        public function getNickname()
        {
            return null;
        }
    };

    $user = (new SocialiteController)->findOrCreateUser($socialUser, 'google');

    expect($user->hasRole('masyarakat'))->toBeTrue();
    expect($user->hasRole('relawan'))->toBeFalse();
});
