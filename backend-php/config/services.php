<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    | Outbound SMS (App\Services\Sms). driver: 'log' (default, writes to the
    | Laravel log — safe for dev/demo) or 'afromessage' (live Ethiopian
    | gateway; requires token + sender identifier from afromessage.com).
    */
    'sms' => [
        'driver' => env('SMS_DRIVER', 'log'),
        'token' => env('SMS_TOKEN'),
        'identifier' => env('SMS_IDENTIFIER'),
        'sender' => env('SMS_SENDER', 'Edil'),
    ],

];
