<?php
/**
 * Safety migration for databases created before payments/FCM were folded into the base migration.
 * Fully idempotent — safe to run on fresh installs that already have the final schema.
 */
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $t) {
                if (!Schema::hasColumn('orders', 'payment_status')) {
                    $t->string('payment_status', 32)->default('unpaid')->after('status');
                }
                if (!Schema::hasColumn('orders', 'payment_provider')) {
                    $t->string('payment_provider', 32)->nullable();
                }
                if (!Schema::hasColumn('orders', 'payment_tx_ref')) {
                    $t->string('payment_tx_ref', 128)->nullable()->unique();
                }
                if (!Schema::hasColumn('orders', 'payment_reference')) {
                    $t->string('payment_reference', 128)->nullable();
                }
                if (!Schema::hasColumn('orders', 'paid_at')) {
                    $t->timestamp('paid_at')->nullable();
                }
            });
        }

        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'fcm_token')) {
            Schema::table('users', function (Blueprint $t) {
                $t->string('fcm_token', 512)->nullable()->after('avatar');
            });
        }

        if (!Schema::hasTable('payments')) {
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
    }

    public function down(): void
    {
        // Intentionally empty — do not drop payment data in production
    }
};
