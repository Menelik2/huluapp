<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\PaymentController;

Route::post('/auth/google', [AuthController::class, 'google'])->middleware('throttle:10,1');

Route::get('/products', [ProductController::class, 'index']);
Route::get('/categories', [CategoryController::class, 'index']);

// Chapa webhook must be public — authenticity is verified by calling Chapa verify API
Route::post('/payments/chapa/webhook', [PaymentController::class, 'webhook'])
    ->middleware('throttle:60,1');
Route::get('/payments/chapa/webhook', [PaymentController::class, 'webhook'])
    ->middleware('throttle:60,1');

Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::post('/device/fcm', [DeviceController::class, 'storeFcm']);

    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders', [OrderController::class, 'mine']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);

    Route::post('/payments/chapa/initialize', [PaymentController::class, 'initialize'])
        ->middleware('throttle:20,1');
    Route::get('/payments/chapa/verify/{txRef}', [PaymentController::class, 'verify'])
        ->middleware('throttle:30,1');

    Route::post('/chat/send', [ChatController::class, 'send'])->middleware('throttle:30,1');
    Route::get('/chat/messages/{userId}', [ChatController::class, 'messages']);
    Route::get('/chat/channel/{userId}', [ChatController::class, 'channelInfo']);

    Route::get('/chat/admin', function () {
        $admin = \App\Models\User::where('role', 'admin')->orderBy('id')->first(['id', 'name', 'email', 'avatar']);
        if (!$admin) {
            return response()->json(['message' => 'No admin available.'], 404);
        }
        return $admin;
    });

    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/overview', [AdminController::class, 'overview']);
        Route::get('/analytics', [AdminController::class, 'analytics']);
        Route::get('/reports', [AdminController::class, 'reports']);
        Route::get('/orders', [OrderController::class, 'index']);
        Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);
        Route::get('/inventory', [AdminController::class, 'inventory']);
        Route::put('/inventory/{productId}', [AdminController::class, 'updateInventory']);
        Route::get('/customers', [AdminController::class, 'customers']);
        Route::get('/chat-users', [AdminController::class, 'chatUsers']);

        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

        Route::get('/products', [ProductController::class, 'adminIndex']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::post('/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    });
});
