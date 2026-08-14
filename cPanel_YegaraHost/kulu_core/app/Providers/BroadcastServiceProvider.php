<?php
namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;

class BroadcastServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Auth endpoint for Echo: POST /api/broadcasting/auth (Sanctum Bearer)
        Broadcast::routes([
            'prefix' => 'api',
            'middleware' => ['api', 'auth:sanctum'],
        ]);

        // Channel authorization rules (also loaded via withRouting channels:)
        if (file_exists(base_path('routes/channels.php'))) {
            require base_path('routes/channels.php');
        }
    }
}
