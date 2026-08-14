<?php
return [
    'firebase' => [
        'credentials' => env('FIREBASE_CREDENTIALS'),
    ],
    'kulu' => [
        // Primary admin email (required for at least one admin)
        'admin_email' => env('ADMIN_EMAIL'),
        // Optional extra admins: "a@x.com,b@y.com"
        'admin_emails' => env('ADMIN_EMAILS'),
    ],
    'chapa' => [
        'secret_key' => env('CHAPA_SECRET_KEY'),
        'public_key' => env('CHAPA_PUBLIC_KEY'),
    ],
];
