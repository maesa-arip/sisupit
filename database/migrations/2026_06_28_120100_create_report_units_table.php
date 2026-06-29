<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pivot dispatch unit ke insiden (TASK_09 Fase 2). Sejajar bentuk report_officers/
 * report_helpers: satu baris per pengerahan unit ke sebuah laporan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('unit_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('dispatched'); // dispatched/released
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_units');
    }
};
