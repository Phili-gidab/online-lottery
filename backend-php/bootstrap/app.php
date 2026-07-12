<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // The only login is Filament's — send unauthenticated admins there.
        $middleware->redirectGuestsTo('/admin/login');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

// Shared hosting: the app ships without its own public/ and the real web
// root is the sibling public_html. Locally public/ exists and stays in charge.
$sharedDocroot = dirname(__DIR__, 2).'/public_html';
if (! is_dir($app->publicPath()) && is_dir($sharedDocroot)) {
    $app->usePublicPath($sharedDocroot);
}

return $app;
