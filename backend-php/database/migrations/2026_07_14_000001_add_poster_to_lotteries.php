<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lotteries', function (Blueprint $table) {
            // Campaign promo poster (admin upload) — shown on the homepage.
            $table->string('poster_path')->nullable()->after('payment_instructions');
        });
    }

    public function down(): void
    {
        Schema::table('lotteries', function (Blueprint $table) {
            $table->dropColumn('poster_path');
        });
    }
};
