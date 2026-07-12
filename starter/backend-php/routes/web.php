<?php

use App\Models\Ticket;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

/**
 * The static frontend (Next.js export) lives in public/. Apache/LiteSpeed
 * serve those files directly; these routes make the same clean URLs work
 * under `php artisan serve` too, and act as a safety net on any server.
 */
Route::get('/', function () {
    $index = public_path('index.html');

    return is_file($index) ? response()->file($index) : redirect('/admin');
});

/**
 * Receipt screenshots live on the private disk — this authenticated route is
 * the only way to view them (used by the admin panel's "View receipt" modal).
 */
Route::get('/admin/receipts/{ticket}', function (Ticket $ticket) {
    abort_unless($ticket->receipt_path && Storage::disk('local')->exists($ticket->receipt_path), 404);

    return Storage::disk('local')->response($ticket->receipt_path);
})->middleware(['web', 'auth'])->name('admin.receipt');

/** Full ticket export for record-keeping / NLA reporting. Admins only. */
Route::get('/admin/tickets/export', function () {
    $filename = 'edil-tickets-' . now()->format('Y-m-d-Hi') . '.csv';

    return response()->streamDownload(function () {
        $out = fopen('php://output', 'w');
        fputcsv($out, [
            'ID', 'Lottery', 'First name', 'Father name', 'Phone', 'Payment ref',
            'Status', 'Ticket number', 'Source', 'Registered at', 'Approved at',
        ]);
        Ticket::with('lottery')->orderBy('id')->chunk(500, function ($tickets) use ($out) {
            foreach ($tickets as $t) {
                fputcsv($out, [
                    $t->id, $t->lottery?->title, $t->first_name, $t->father_name,
                    $t->phone, $t->payment_ref, $t->ticket_status, $t->ticket_number,
                    $t->source, $t->created_at, $t->approved_at,
                ]);
            }
        });
        fclose($out);
    }, $filename, ['Content-Type' => 'text/csv']);
})->middleware(['web', 'auth'])->name('admin.tickets.export');

/**
 * Static-page fallback: /register/ → public/register/index.html, etc.
 * Only fires when no real route or file matched.
 */
Route::fallback(function () {
    $path = trim(request()->path(), '/');
    if ($path !== '' && ! str_starts_with($path, 'api') && ! str_starts_with($path, 'admin')) {
        foreach ([public_path($path . '/index.html'), public_path($path . '.html')] as $file) {
            if (is_file($file)) {
                return response()->file($file);
            }
        }

        // Next segment-cache payloads: the client requests them dot-joined
        // (/results/__next.results.__PAGE__.txt) but the exporter may nest
        // them (results/__next.results/__PAGE__.txt). Map dot → slash.
        $base = basename($path);
        if (str_starts_with($base, '__next.') && str_ends_with($base, '.txt')
            && ! str_contains($path, '..')) {
            $dir = dirname($path) === '.' ? '' : dirname($path) . '/';
            $stem = substr($base, 0, -4);
            $parts = explode('.', $stem);
            for ($i = count($parts) - 1; $i >= 2; $i--) {
                $candidate = public_path($dir
                    . implode('.', array_slice($parts, 0, $i)) . '/'
                    . implode('.', array_slice($parts, $i)) . '.txt');
                if (is_file($candidate)) {
                    return response()->file($candidate);
                }
            }
        }
        // Branded 404 from the static export, with the correct status code.
        $notFound = public_path('404.html');
        if (is_file($notFound)) {
            return response(file_get_contents($notFound), 404)
                ->header('Content-Type', 'text/html');
        }
    }
    abort(404);
});
