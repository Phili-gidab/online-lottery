<?php

namespace App\Filament\Widgets;

use App\Models\Draw;
use App\Models\Ticket;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

/** Admin landing page at a glance: what needs review, what's sold, what's won. */
class LotteryStatsOverview extends BaseWidget
{
    protected static ?int $sort = 0;

    protected function getStats(): array
    {
        $pending = Ticket::where('ticket_status', 'pending')->count();
        $active = Ticket::where('ticket_status', 'active')->count();

        $revenue = Ticket::query()
            ->join('lotteries', 'lotteries.id', '=', 'tickets.lottery_id')
            ->where('tickets.ticket_status', 'active')
            ->sum('lotteries.ticket_price');

        $drawsDone = Draw::where('draw_status', 'drawn')->count();
        $drawsTotal = Draw::count();

        return [
            Stat::make('Entries awaiting review', (string) $pending)
                ->description($pending > 0 ? 'Verify payments in Tickets' : 'All caught up')
                ->color($pending > 0 ? 'warning' : 'success'),
            Stat::make('Active tickets', (string) $active)
                ->description('In every scheduled draw')
                ->color('success'),
            Stat::make('Verified revenue', number_format((float) $revenue) . ' ETB')
                ->description('Active tickets × ticket price'),
            Stat::make('Draws executed', "{$drawsDone} / {$drawsTotal}")
                ->description($drawsDone < $drawsTotal ? 'Run draws from the Draws page' : 'All draws complete'),
        ];
    }
}
