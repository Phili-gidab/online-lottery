<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ad;
use App\Models\Lottery;

class LotteryController extends Controller
{
    /** All non-draft lotteries, newest first, with draws. */
    public function index()
    {
        $lotteries = Lottery::with('draws')
            ->where('lottery_status', '!=', 'draft')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $lotteries->map(fn (Lottery $l) => $l->toApi())->all(),
        ]);
    }

    public function show(Lottery $lottery)
    {
        abort_if($lottery->lottery_status === 'draft', 404);
        $lottery->load('draws');

        return response()->json(['data' => $lottery->toApi()]);
    }

    /** Anonymous counters only — never any ticket data. */
    public function stats(Lottery $lottery)
    {
        abort_if($lottery->lottery_status === 'draft', 404);

        return response()->json([
            'data' => [
                'activeTickets' => $lottery->tickets()->where('ticket_status', 'active')->count(),
                'pendingTickets' => $lottery->tickets()->where('ticket_status', 'pending')->count(),
                'maxTickets' => $lottery->max_tickets,
                'soldOut' => $lottery->isSoldOut(),
            ],
        ]);
    }
}
