<?php

namespace Database\Seeders;

use App\Models\Draw;
use App\Models\Lottery;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin', 'password' => 'Admin12345!'] // hashed by the cast
        );

        // Demo campaign — only when the table is completely empty.
        if (Lottery::count() === 0 && env('SEED_DEMO', true)) {
            $lottery = Lottery::create([
                'title' => 'Grand Prize Lottery — Demo',
                'company' => 'Demo Trading PLC',
                'lottery_status' => 'open',
                'ticket_price' => 100,
                'ticket_digits' => 6,
                'allow_multiple_wins' => false,
                'description' => 'Demo campaign (seeded automatically). One ticket enters you into all three draws.',
                'payment_instructions' => "Pay 100 ETB to CBE account 1000-1234-5678 (Demo Trading PLC) or Telebirr 0912345678, then register below with your receipt reference number and a screenshot.",
            ]);

            foreach ([
                ['draw_number' => 1, 'category' => 'house', 'prize_name' => '3-Bedroom Condominium, Addis Ababa'],
                ['draw_number' => 2, 'category' => 'car', 'prize_name' => 'Toyota Vitz'],
                ['draw_number' => 3, 'category' => 'phone', 'prize_name' => 'iPhone 15'],
            ] as $d) {
                Draw::create([
                    ...$d,
                    'lottery_id' => $lottery->id,
                    'draw_status' => 'scheduled',
                    'draw_date' => now()->addDays(7 + $d['draw_number']),
                ]);
            }
        }
    }
}
