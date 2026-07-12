<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lottery extends Model
{
    protected $fillable = [
        'title', 'company', 'description', 'lottery_status', 'ticket_price',
        'ticket_digits', 'max_tickets', 'allow_multiple_wins', 'payment_instructions',
    ];

    protected $casts = [
        'ticket_price' => 'float',
        'ticket_digits' => 'integer',
        'max_tickets' => 'integer',
        'allow_multiple_wins' => 'boolean',
    ];

    public function draws(): HasMany
    {
        return $this->hasMany(Draw::class)->orderBy('draw_number');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    /** Tickets that occupy a slot against max_tickets (pending + active). */
    public function soldCount(): int
    {
        return $this->tickets()->whereIn('ticket_status', ['pending', 'active'])->count();
    }

    public function isSoldOut(): bool
    {
        return $this->max_tickets !== null && $this->soldCount() >= $this->max_tickets;
    }

    /** Strapi-compatible API shape so the existing frontend keeps working. */
    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'documentId' => (string) $this->id,
            'title' => $this->title,
            'company' => $this->company,
            'description' => $this->description,
            'lotteryStatus' => $this->lottery_status,
            'ticketPrice' => $this->ticket_price,
            'ticketDigits' => $this->ticket_digits,
            'maxTickets' => $this->max_tickets,
            'paymentInstructions' => $this->payment_instructions,
            'draws' => $this->draws->map(fn (Draw $d) => $d->toApi())->all(),
        ];
    }
}
