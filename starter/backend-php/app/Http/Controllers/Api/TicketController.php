<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lottery;
use App\Models\Ticket;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    private const PHONE_RE = '/^(\+251[79]\d{8}|0[79]\d{8})$/';

    /**
     * Public registration. Status/number/source are forced server-side —
     * nobody can self-approve or pick a number. Receipt goes to the PRIVATE
     * disk; only authenticated admins can view it.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'firstName' => ['required', 'string', 'max:80'],
            'fatherName' => ['required', 'string', 'max:80'],
            'phone' => ['required', 'string', 'max:20', 'regex:' . self::PHONE_RE],
            'paymentRef' => ['required', 'string', 'max:64'],
            'lottery' => ['required', 'integer', 'exists:lotteries,id'],
            'receipt' => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp,gif', 'max:5120'],
        ], [
            'phone.regex' => 'Please provide a valid Ethiopian phone number (e.g. 0912345678).',
            'receipt.required' => 'The receipt screenshot is required.',
        ]);

        $lottery = Lottery::findOrFail($data['lottery']);
        if ($lottery->lottery_status !== 'open') {
            return response()->json([
                'error' => ['message' => 'This lottery is not accepting registrations'],
            ], 400);
        }

        if ($lottery->isSoldOut()) {
            return response()->json([
                'error' => ['message' => 'All tickets for this lottery have been claimed — sales are closed.'],
            ], 400);
        }

        // One payment = one ticket. A reused reference number is either a
        // double-submit or an attempt to reuse someone's receipt.
        $ref = trim($data['paymentRef']);
        $refTaken = Ticket::where('lottery_id', $lottery->id)
            ->whereRaw('LOWER(payment_ref) = ?', [mb_strtolower($ref)])
            ->exists();
        if ($refTaken) {
            return response()->json([
                'error' => ['message' => 'This payment reference has already been registered. If that was you, check your ticket status instead — or contact support.'],
            ], 422);
        }

        $path = $request->file('receipt')->store('receipts', 'local');

        $ticket = Ticket::create([
            'lottery_id' => $lottery->id,
            'first_name' => trim($data['firstName']),
            'father_name' => trim($data['fatherName']),
            'phone' => Ticket::normalizePhone($data['phone']),
            'payment_ref' => $ref,
            'receipt_path' => $path,
            'ticket_status' => 'pending',
            'source' => 'web',
        ]);

        // Deliberately minimal response: no PII echo.
        return response()->json([
            'data' => ['documentId' => (string) $ticket->id, 'ticketStatus' => 'pending'],
        ], 201);
    }

    /**
     * Status of the caller's own saved entries ("My tickets" panel).
     * Requires the registration phone to match every id — ids alone reveal
     * nothing. Rate-limited via route middleware.
     */
    public function status(Request $request)
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:20', 'regex:' . self::PHONE_RE],
            'ids' => ['required', 'array', 'max:20'],
            'ids.*' => ['integer'],
        ]);

        $tickets = Ticket::with(['lottery', 'wonDraws'])
            ->whereIn('id', $data['ids'])
            ->where('phone', Ticket::normalizePhone($data['phone']))
            ->get();

        return response()->json([
            'data' => $tickets->map(fn (Ticket $t) => [
                'documentId' => (string) $t->id,
                'ticketStatus' => $t->ticket_status,
                'ticketNumber' => $t->ticket_number,
                'lottery' => $t->lottery?->title,
                'wins' => $t->wonDraws->map(fn ($d) => [
                    'drawNumber' => $d->draw_number,
                    'prizeName' => $d->prize_name,
                ])->all(),
            ])->all(),
        ]);
    }

    /**
     * "Check my ticket" — requires BOTH phone and number to match, so ticket
     * numbers cannot be enumerated. Rate-limited via route middleware.
     */
    public function check(Request $request)
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:20', 'regex:' . self::PHONE_RE],
            'ticketNumber' => ['required', 'string', 'regex:/^\d{4,10}$/'],
        ]);

        $ticket = Ticket::with(['lottery', 'wonDraws'])
            ->where('phone', Ticket::normalizePhone($data['phone']))
            ->where('ticket_number', trim($data['ticketNumber']))
            ->first();

        if (! $ticket) {
            return response()->json(['data' => ['found' => false]]);
        }

        return response()->json([
            'data' => [
                'found' => true,
                'ticketNumber' => $ticket->ticket_number,
                'ticketStatus' => $ticket->ticket_status,
                'lottery' => $ticket->lottery?->title,
                'wins' => $ticket->wonDraws->map(fn ($d) => [
                    'drawNumber' => $d->draw_number,
                    'prizeName' => $d->prize_name,
                    'category' => $d->category,
                ])->all(),
            ],
        ]);
    }
}
