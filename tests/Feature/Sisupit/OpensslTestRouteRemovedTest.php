<?php

it('no longer exposes the debug openssl-test route', function () {
    $this->get('/openssl-test')->assertNotFound();
});
