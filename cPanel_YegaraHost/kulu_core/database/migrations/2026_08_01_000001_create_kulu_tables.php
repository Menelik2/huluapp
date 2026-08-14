<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $t) {
            $t->id();
            $t->string('firebase_uid')->unique();
            $t->string('name');
            $t->string('email')->unique();
            $t->string('avatar', 2048)->nullable();
            $t->enum('role', ['user', 'admin'])->default('user');
            $t->string('fcm_token', 512)->nullable();
            $t->rememberToken();
            $t->timestamps();
            $t->index('role');
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $t) {
            $t->id();
            $t->string('name')->unique();
            $t->timestamps();
        });

        Schema::create('products', function (Blueprint $t) {
            $t->id();
            $t->foreignId('category_id')->constrained()->cascadeOnDelete();
            $t->foreignId('seller_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('title');
            $t->text('description');
            $t->decimal('price', 12, 2);
            $t->string('image_url', 2048);
            $t->unsignedInteger('stock_quantity')->default(0);
            $t->boolean('active')->default(true);
            $t->timestamps();
            $t->index('active');
            $t->index(['active', 'stock_quantity']);
        });

        Schema::create('orders', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->decimal('total_amount', 12, 2);
            $t->enum('status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])->default('pending');
            $t->string('payment_status', 32)->default('unpaid');
            $t->string('payment_provider', 32)->nullable();
            $t->string('payment_tx_ref', 128)->nullable()->unique();
            $t->string('payment_reference', 128)->nullable();
            $t->timestamp('paid_at')->nullable();
            $t->string('shipping_name');
            $t->string('shipping_phone', 50);
            $t->text('shipping_address');
            $t->timestamps();
            $t->index('status');
            $t->index('payment_status');
            $t->index(['user_id', 'status']);
        });

        Schema::create('order_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_id')->constrained()->restrictOnDelete();
            $t->unsignedInteger('quantity');
            $t->decimal('unit_price', 12, 2);
            $t->timestamps();
        });

        Schema::create('messages', function (Blueprint $t) {
            $t->id();
            $t->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $t->foreignId('receiver_id')->constrained('users')->cascadeOnDelete();
            $t->text('message');
            $t->timestamps();
            $t->index(['sender_id', 'receiver_id', 'created_at']);
            $t->index(['receiver_id', 'created_at']);
        });

        Schema::create('payments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('provider', 32);
            $t->string('tx_ref', 128)->unique();
            $t->string('provider_reference', 128)->nullable();
            $t->decimal('amount', 12, 2);
            $t->string('currency', 8)->default('ETB');
            $t->string('status', 32)->default('pending');
            $t->json('raw_payload')->nullable();
            $t->timestamps();
            $t->index(['order_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('users');
    }
};
