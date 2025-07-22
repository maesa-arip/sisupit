<?php

use App\Enums\BookLanguage;
use App\Enums\BookStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->string('book_code');
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('author');
            $table->unsignedBigInteger('publication_year');
            $table->string('isbn');
            $table->string('language')->default(BookLanguage::INDONESIA->value);
            $table->text('synopsis')->nullable();
            $table->unsignedBigInteger('number_of_pages')->default(0);
            $table->string('status')->default(BookStatus::AVAILABLE->value);
            $table->string('cover')->nullable();
            $table->unsignedBigInteger('price')->default(0);
            $table->foreignId('category_id')->constrained('categories');
            $table->foreignId('publisher_id')->constrained('publishers')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
