<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lotteries', function (Blueprint $table) {
            // Optional hard cap on sold tickets (active + pending). Null = unlimited.
            $table->unsignedInteger('max_tickets')->nullable()->after('ticket_digits');
        });

        Schema::table('tickets', function (Blueprint $table) {
            // Duplicate-payment-reference lookups at registration time.
            $table->index(['lottery_id', 'payment_ref']);
        });
    }

    public function down(): void
    {
        Schema::table('lotteries', function (Blueprint $table) {
            $table->dropColumn('max_tickets');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex(['lottery_id', 'payment_ref']);
        });
    }
};
