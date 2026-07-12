<?php

use App\Http\Controllers\Api\LotteryController;
use App\Http\Controllers\Api\TicketController;
use App\Models\Ad;
use Illuminate\Support\Facades\Route;

Route::get('/lotteries', [LotteryController::class, 'index']);
Route::get('/lotteries/{lottery}', [LotteryController::class, 'show']);
Route::get('/lotteries/{lottery}/stats', [LotteryController::class, 'stats']);

Route::get('/ads', function () {
    return response()->json([
        'data' => Ad::where('active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Ad $ad) => $ad->toApi())
            ->all(),
    ]);
});

Route::post('/tickets', [TicketController::class, 'store'])->middleware('throttle:5,1');
Route::post('/tickets/check', [TicketController::class, 'check'])->middleware('throttle:12,1');
Route::post('/tickets/status', [TicketController::class, 'status'])->middleware('throttle:12,1');
