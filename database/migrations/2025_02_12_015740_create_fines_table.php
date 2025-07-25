<?php

use App\Enums\FinePaymentStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('return_book_id')->constrained('return_books')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('late_fee')->default(0);
            $table->decimal('other_fee')->default(0);
            $table->decimal('total_fee')->computed();
            $table->date('fine_date');
            $table->string('payment_status')->default(FinePaymentStatus::PENDING->value);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fines');
    }
};
