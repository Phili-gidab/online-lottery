<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Validation\ValidationException;

class Ticket extends Model
{
    protected $fillable = [
        'lottery_id', 'first_name', 'father_name', 'phone', 'payment_ref',
        'receipt_path', 'ticket_status', 'ticket_number', 'source', 'notes',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    public function lottery(): BelongsTo
    {
        return $this->belongsTo(Lottery::class);
    }

    public function wonDraws(): HasMany
    {
        return $this->hasMany(Draw::class, 'winning_ticket_id');
    }

    /**
     * Ticket number invariants (ported from the reviewed Strapi build):
     *  - an assigned number can never be blanked;
     *  - a manual number must be exactly lottery.ticket_digits digits and
     *    globally unique (DB constraint backs the race);
     *  - going "active" without a number auto-generates one and stamps
     *    approved_at.
     * Runs on every save — admin panel, seeder, and API alike.
     */
    protected static function booted(): void
    {
        static::saving(function (Ticket $ticket) {
            $digits = $ticket->lottery?->ticket_digits ?? 6;

            // One canonical phone format (07/09…) no matter how it was typed,
            // so check/status lookups always match the registration.
            if (filled($ticket->phone)) {
                $ticket->phone = self::normalizePhone($ticket->phone);
            }

            // Never allow blanking an assigned number — except on rejection,
            // which releases a claimed number back to the pool.
            if ($ticket->exists && $ticket->isDirty('ticket_number')
                && blank($ticket->ticket_number)
                && filled($ticket->getOriginal('ticket_number'))
                && $ticket->ticket_status !== 'rejected') {
                $ticket->ticket_number = $ticket->getOriginal('ticket_number');
            }

            // Validate any manual number (new or changed).
            if (filled($ticket->ticket_number) && $ticket->isDirty('ticket_number')) {
                if (! preg_match('/^\d{' . $digits . '}$/', (string) $ticket->ticket_number)) {
                    throw ValidationException::withMessages([
                        'ticket_number' => "Ticket number must be exactly {$digits} digits.",
                    ]);
                }
                $clash = self::where('ticket_number', $ticket->ticket_number)
                    ->when($ticket->exists, fn ($q) => $q->where('id', '!=', $ticket->id))
                    ->exists();
                if ($clash) {
                    throw ValidationException::withMessages([
                        'ticket_number' => "Ticket number {$ticket->ticket_number} is already taken.",
                    ]);
                }
            }

            // Activation: assign a number + approval timestamp.
            if ($ticket->ticket_status === 'active') {
                if (blank($ticket->ticket_number)) {
                    $ticket->ticket_number = self::generateUniqueNumber($digits);
                }
                if (blank($ticket->approved_at)) {
                    $ticket->approved_at = now();
                }
            }
        });
    }

    /**
     * Canonical local format: +251912345678 / 251912345678 → 0912345678.
     * Strips spaces and dashes; anything unrecognised is returned trimmed
     * (validation upstream decides whether to accept it).
     */
    public static function normalizePhone(string $phone): string
    {
        $p = preg_replace('/[\s\-]+/', '', trim($phone));
        if (preg_match('/^\+?251([79]\d{8})$/', $p, $m)) {
            return '0' . $m[1];
        }

        return $p;
    }

    public static function generateUniqueNumber(int $digits): string
    {
        for ($i = 0; $i < 50; $i++) {
            $candidate = str_pad((string) random_int(0, (10 ** $digits) - 1), $digits, '0', STR_PAD_LEFT);
            if (! self::where('ticket_number', $candidate)->exists()) {
                return $candidate;
            }
        }
        throw new \RuntimeException('Could not generate a unique ticket number — pool nearly full.');
    }
}
