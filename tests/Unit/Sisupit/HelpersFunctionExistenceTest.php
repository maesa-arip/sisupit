<?php

it('defines signatureMidtrans() independently of usernameGenerator() having been called', function () {
    expect(function_exists('signatureMidtrans'))->toBeTrue();
    expect(signatureMidtrans('order-1', '200', '10000', 'secret'))->toBe(
        hash('sha512', 'order-1' . '200' . '10000' . 'secret')
    );
});
