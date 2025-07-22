<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained('books')->cascadeOnDelete();
            $table->unsignedBigInteger('total')->default(0);
            $table->unsignedBigInteger('available')->default(0);
            $table->unsignedBigInteger('loan')->default(0);
            $table->unsignedBigInteger('lost')->default(0);
            $table->unsignedBigInteger('damaged')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};
