<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lotteries', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('company');
            $table->text('description')->nullable();
            $table->string('lottery_status', 20)->default('draft'); // draft|open|closed|completed
            $table->decimal('ticket_price', 10, 2)->nullable();
            $table->unsignedTinyInteger('ticket_digits')->default(6);
            $table->boolean('allow_multiple_wins')->default(false);
            $table->text('payment_instructions')->nullable();
            $table->timestamps();
        });

        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lottery_id')->constrained()->cascadeOnDelete();
            $table->string('first_name', 80);
            $table->string('father_name', 80);
            $table->string('phone', 20);
            $table->string('payment_ref', 64);
            $table->string('receipt_path')->nullable();
            $table->string('ticket_status', 20)->default('pending'); // pending|active|rejected
            // Globally unique — the DB constraint is the last line of defense
            // against concurrent-approval races.
            $table->string('ticket_number', 12)->nullable()->unique();
            $table->string('source', 10)->default('web'); // web|admin
            $table->text('notes')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->index(['phone', 'ticket_number']);
            $table->index(['lottery_id', 'ticket_status']);
        });

        Schema::create('draws', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lottery_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('draw_number'); // 1..5
            $table->string('title')->nullable();
            $table->string('category', 20); // house|car|phone|cash|other
            $table->string('prize_name');
            $table->string('prize_image_path')->nullable();
            $table->dateTime('draw_date')->nullable();
            $table->string('draw_status', 20)->default('scheduled'); // scheduled|drawn
            $table->string('winner_ticket_number', 12)->nullable();
            $table->string('winner_display_name')->nullable();
            $table->timestamp('drawn_at')->nullable();
            $table->foreignId('winning_ticket_id')->nullable()->constrained('tickets')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('ads', function (Blueprint $table) {
            $table->id();
            $table->string('sponsor_name')->nullable();
            $table->string('image_path');
            $table->string('link_url')->nullable();
            $table->boolean('active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('draws');
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('ads');
        Schema::dropIfExists('lotteries');
    }
};
