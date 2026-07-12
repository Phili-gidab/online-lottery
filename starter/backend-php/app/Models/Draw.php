<?php

namespace App\Models;

use App\Services\Sms;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class Draw extends Model
{
    protected $fillable = [
        'lottery_id', 'draw_number', 'title', 'category', 'prize_name',
        'prize_image_path', 'draw_date', 'draw_status',
    ];

    protected $casts = [
        'draw_number' => 'integer',
        'draw_date' => 'datetime',
        'drawn_at' => 'datetime',
    ];

    public function lottery(): BelongsTo
    {
        return $this->belongsTo(Lottery::class);
    }

    public function winningTicket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'winning_ticket_id');
    }

    /**
     * Execute this draw: pick a crypto-random winner among the lottery's
     * ACTIVE tickets. Atomic claim (scheduled → drawn) prevents double runs;
     * a ticket that already won is excluded unless allow_multiple_wins.
     */
    public function execute(): array
    {
        $lottery = $this->lottery;
        if (! $lottery) {
            throw new RuntimeException('Draw has no lottery attached.');
        }

        // Atomic claim — loses cleanly if another request got here first.
        $claimed = DB::table('draws')
            ->where('id', $this->id)
            ->where('draw_status', 'scheduled')
            ->update(['draw_status' => 'drawn', 'drawn_at' => now()]);
        if ($claimed === 0) {
            throw new RuntimeException('This draw has already been executed.');
        }

        $query = Ticket::query()
            ->where('lottery_id', $lottery->id)
            ->where('ticket_status', 'active')
            ->whereNotNull('ticket_number');

        if (! $lottery->allow_multiple_wins) {
            $query->whereNotIn('id', function ($q) use ($lottery) {
                $q->select('winning_ticket_id')
                    ->from('draws')
                    ->where('lottery_id', $lottery->id)
                    ->whereNotNull('winning_ticket_id');
            });
        }

        $eligible = $query->get();
        if ($eligible->isEmpty()) {
            // Release the claim so the draw can run once tickets exist.
            DB::table('draws')->where('id', $this->id)
                ->update(['draw_status' => 'scheduled', 'drawn_at' => null]);
            throw new RuntimeException('No eligible active tickets for this draw.');
        }

        $winner = $eligible[random_int(0, $eligible->count() - 1)];
        $displayName = trim($winner->first_name . ' ' .
            ($winner->father_name !== '' ? mb_substr($winner->father_name, 0, 1) . '.' : ''));

        $this->forceFill([
            'winning_ticket_id' => $winner->id,
            'winner_ticket_number' => $winner->ticket_number,
            'winner_display_name' => $displayName,
        ])->save();

        // Congratulate the winner — best-effort, never blocks the draw.
        Sms::send(
            $winner->phone,
            "Congratulations {$winner->first_name}! Your ticket No {$winner->ticket_number} "
            . "won the {$this->prize_name} in {$lottery->title}. "
            . 'We will contact you on this number to arrange your prize.'
        );

        return [
            'eligibleTickets' => $eligible->count(),
            'winnerTicketNumber' => $winner->ticket_number,
            'winnerDisplayName' => $displayName,
        ];
    }

    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'documentId' => (string) $this->id,
            'drawNumber' => $this->draw_number,
            'title' => $this->title,
            'category' => $this->category,
            'prizeName' => $this->prize_name,
            'prizeImage' => $this->prize_image_path
                ? ['url' => Storage::disk('public')->url($this->prize_image_path)]
                : null,
            'drawDate' => $this->draw_date?->toIso8601String(),
            'drawStatus' => $this->draw_status,
            'winnerTicketNumber' => $this->winner_ticket_number,
            'winnerDisplayName' => $this->winner_display_name,
            'drawnAt' => $this->drawn_at?->toIso8601String(),
        ];
    }
}
