<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChapaService
{
    protected string $secret;
    protected string $base = 'https://api.chapa.co/v1';

    public function __construct()
    {
        $this->secret = (string) config('services.chapa.secret_key');
    }

    public function initialize(array $payload): array
    {
        if (!$this->secret) {
            throw new \RuntimeException('CHAPA_SECRET_KEY is not configured.');
        }

        $response = Http::withToken($this->secret)
            ->acceptJson()
            ->timeout(30)
            ->post($this->base . '/transaction/initialize', $payload);

        $json = $response->json() ?? [];

        if (!$response->successful() || ($json['status'] ?? '') !== 'success') {
            $msg = $json['message'] ?? 'Chapa initialize failed';
            Log::warning('Chapa initialize error', ['body' => $json]);
            throw new \RuntimeException(is_string($msg) ? $msg : 'Chapa initialize failed');
        }

        return $json;
    }

    public function verify(string $txRef): array
    {
        if (!$this->secret) {
            throw new \RuntimeException('CHAPA_SECRET_KEY is not configured.');
        }

        $response = Http::withToken($this->secret)
            ->acceptJson()
            ->timeout(30)
            ->get($this->base . '/transaction/verify/' . urlencode($txRef));

        $json = $response->json() ?? [];

        if (!$response->successful()) {
            Log::warning('Chapa verify error', ['body' => $json]);
            throw new \RuntimeException($json['message'] ?? 'Chapa verify failed');
        }

        return $json;
    }
}
