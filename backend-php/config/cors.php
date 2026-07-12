<?php

/**
 * The public API is read-mostly and the write endpoints are throttled, so a
 * permissive CORS policy is fine. In production the static frontend is served
 * from the same domain anyway; this mainly enables local dev (3000 → 8000).
 */

return [
    'paths' => ['api/*', 'storage/*'],
    'allowed_methods' => ['GET', 'POST', 'OPTIONS'],
    'allowed_origins' => ['*'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 3600,
    'supports_credentials' => false,
];
