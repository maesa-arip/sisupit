<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Schema::create('companies', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('user_id')->constrained();
        //     $table->string('name');
        //     $table->string('slug');
        //     $table->timestamps();
        //     $table->softDeletes();
        // });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained();
            $table->string('plan_name');
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->boolean('is_trial')->default(false);
            $table->boolean('is_active')->default(true);
            $table->dateTime('cancelled_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained();
            $table->foreignId('subscription_id')->constrained();
            $table->enum('duration_type', ['month', 'year']);
            $table->integer('duration');
            $table->decimal('amount', 15, 2);
            $table->dateTime('payment_date');
            $table->string('payment_method');
            $table->string('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained();
            $table->string('name');
            $table->string('slug');
            $table->boolean('status')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('areas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained();
            $table->string('name');
            $table->string('slug');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained();
            $table->integer('number');
            $table->foreignId('area_id')->constrained();
            $table->integer('capacity');
            $table->tinyInteger('status');
            $table->string('customer_name')->nullable();
            $table->dateTime('start_time')->nullable();
            $table->dateTime('start_serve')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Schema::create('categories', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('company_id')->constrained();
        //     $table->string('name');
        //     $table->string('slug');
        //     $table->timestamps();
        //     $table->softDeletes();
        // });

        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained();
            $table->string('name');
            $table->string('slug');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('ingerdients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained();
            $table->foreignId('category_id')->constrained();
            $table->foreignId('unit_id')->constrained();
            $table->string('name');
            $table->string('slug');
            $table->string('sku')->unique();
            $table->decimal('cost', 15, 2);
            $table->bigInteger('stock');
            $table->bigInteger('min_stock');
            $table->string('image')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained();
            $table->foreignId('category_id')->constrained();
            $table->foreignId('unit_id')->constrained();
            $table->string('name');
            $table->string('slug');
            $table->string('sku')->unique();
            $table->decimal('price', 15, 2);
            $table->decimal('cost', 15, 2);
            $table->decimal('profit', 15, 2);
            $table->bigInteger('stock');
            $table->bigInteger('min_stock');
            $table->string('image')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained();
            $table->bigInteger('user_id');
            $table->string('invoice_number')->unique();
            $table->string('customer_name')->nullable();
            $table->decimal('total', 15, 2);
            $table->decimal('paid', 15, 2);
            $table->decimal('change', 15, 2);
            $table->string('payment_method');
            $table->enum('type', ['takeaway', 'dinein']);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained();
            $table->foreignId('product_id')->constrained();
            $table->integer('quantity');
            $table->decimal('price', 15, 2);
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained();
            $table->enum('type', ['in', 'out', 'adjustment']);
            $table->integer('quantity');
            $table->text('description');
            $table->bigInteger('user_id');
            $table->foreignId('product_id')->constrained();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('products');
        Schema::dropIfExists('ingerdients');
        Schema::dropIfExists('units');
        // Schema::dropIfExists('categories');
        Schema::dropIfExists('tables');
        Schema::dropIfExists('areas');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('subscription_payments');
        Schema::dropIfExists('subscriptions');
        // Schema::dropIfExists('companies');
    }
};
