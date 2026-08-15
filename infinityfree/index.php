<?php
/**
 * Kulu API - InfinityFree Shared Hosting Entry Point
 * PHP 8.1 Compatible
 */

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Show errors during setup (set to 0 in production after confirmed working)
ini_set('display_errors', '1');
error_reporting(E_ALL);

// Check PHP version
if (PHP_VERSION_ID < 80100) {
    http_response_code(500);
    header('Content-Type: application/json');
    die(json_encode(['error' => 'PHP 8.1+ required. Current: ' . PHP_VERSION]));
}

// Check vendor exists
if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
    http_response_code(500);
    header('Content-Type: application/json');
    die(json_encode(['error' => 'vendor/autoload.php not found. Run composer install.']));
}

// Check .env exists
if (!file_exists(__DIR__ . '/.env')) {
    http_response_code(500);
    header('Content-Type: application/json');
    die(json_encode(['error' => '.env file not found. Upload .env file.']));
}

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Kernel::class);

$response = $kernel->handle(
    $request = Request::capture()
)->send();

$kernel->terminate($request, $response);
