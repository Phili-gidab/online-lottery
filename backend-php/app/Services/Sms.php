<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Outbound SMS with pluggable drivers. Default driver is 'log' (messages go
 * to storage/logs — nothing is sent), so the platform works out of the box.
 * Point SMS_DRIVER=afromessage + credentials in .env to go live; failures
 * are swallowed and logged so SMS can never block an approval or a draw.
 */
class Sms
{
    public static function send(string $phone, string $message): bool
    {
        try {
            return match (config('services.sms.driver', 'log')) {
                'afromessage' => self::viaAfroMessage($phone, $message),
                default => self::viaLog($phone, $message),
            };
        } catch (Throwable $e) {
            Log::warning("SMS to {$phone} failed: {$e->getMessage()}");

            return false;
        }
    }

    private static function viaLog(string $phone, string $message): bool
    {
        Log::info("SMS (log driver) to {$phone}: {$message}");

        return true;
    }

    /** https://afromessage.com — popular Ethiopian SMS gateway. */
    private static function viaAfroMessage(string $phone, string $message): bool
    {
        $response = Http::withToken(config('services.sms.token'))
            ->timeout(10)
            ->post('https://api.afromessage.com/api/send', [
                'from' => config('services.sms.identifier'),
                'sender' => config('services.sms.sender'),
                'to' => $phone,
                'message' => $message,
            ]);

        if (! $response->successful() || $response->json('acknowledge') !== 'success') {
            Log::warning("AfroMessage rejected SMS to {$phone}: " . $response->body());

            return false;
        }

        return true;
    }
}
