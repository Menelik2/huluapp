<?php
namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Services\ChapaService;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function initialize(Request $request, ChapaService $chapa)
    {
        $data = $request->validate([
            'order_id' => 'required|integer|exists:orders,id',
            'return_url' => 'nullable|url',
        ]);

        $user = $request->user();

        $order = Order::where('id', $data['order_id'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'Order already paid.'], 409);
        }

        if ($order->status === 'cancelled') {
            return response()->json(['message' => 'Cannot pay a cancelled order.'], 422);
        }

        if (bccomp((string) $order->total_amount, '0', 2) !== 1) {
            return response()->json(['message' => 'Order total must be greater than zero.'], 422);
        }

        $txRef = 'kulu-' . $order->id . '-' . Str::lower(Str::random(12));

        $names = preg_split('/\s+/', trim($user->name ?: 'Kulu Customer'), 2);
        $first = $names[0] ?? 'Kulu';
        $last = $names[1] ?? 'Customer';

        $callbackUrl = rtrim(config('app.url'), '/') . '/api/payments/chapa/webhook';
        $returnUrl = $data['return_url'] ?? rtrim(config('app.url'), '/') . '/payment/return';

        $phone = preg_replace('/\D+/', '', (string) $order->shipping_phone);
        if (str_starts_with($phone, '251') && strlen($phone) === 12) {
            $phone = '0' . substr($phone, 3);
        }

        $payload = [
            'amount' => number_format((float) $order->total_amount, 2, '.', ''),
            'currency' => 'ETB',
            'email' => $user->email,
            'first_name' => $first,
            'last_name' => $last,
            'phone_number' => $phone,
            'tx_ref' => $txRef,
            'callback_url' => $callbackUrl,
            'return_url' => $returnUrl,
            'customization' => [
                'title' => 'Kulu Order ' . $order->id,
                'description' => 'Payment for Kulu order #' . $order->id,
            ],
            'meta' => [
                'order_id' => (string) $order->id,
                'user_id' => (string) $user->id,
            ],
        ];

        try {
            $result = $chapa->initialize($payload);
        } catch (\Throwable $e) {
            Log::warning('Chapa initialize failed', ['error' => $e->getMessage(), 'order_id' => $order->id]);
            return response()->json(['message' => $e->getMessage()], 502);
        }

        $checkoutUrl = $result['data']['checkout_url'] ?? null;
        if (!$checkoutUrl) {
            return response()->json(['message' => 'Chapa did not return a checkout URL.'], 502);
        }

        DB::transaction(function () use ($order, $user, $txRef) {
            // Mark previous pending attempts as superseded (keep history)
            Payment::where('order_id', $order->id)
                ->where('status', 'pending')
                ->update(['status' => 'superseded']);

            Payment::create([
                'order_id' => $order->id,
                'user_id' => $user->id,
                'provider' => 'chapa',
                'tx_ref' => $txRef,
                'amount' => $order->total_amount,
                'currency' => 'ETB',
                'status' => 'pending',
            ]);

            $order->update([
                'payment_provider' => 'chapa',
                'payment_tx_ref' => $txRef,
                'payment_status' => 'pending',
            ]);
        });

        return response()->json([
            'checkout_url' => $checkoutUrl,
            'tx_ref' => $txRef,
            'order_id' => $order->id,
        ]);
    }

    public function verify(Request $request, string $txRef, ChapaService $chapa, PushNotificationService $push)
    {
        $payment = Payment::where('tx_ref', $txRef)->firstOrFail();

        $order = Order::where('id', $payment->order_id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($payment->status === 'success' && $order->payment_status === 'paid') {
            return response()->json([
                'status' => 'success',
                'order' => $order->load('items.product'),
            ]);
        }

        try {
            $result = $chapa->verify($txRef);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        $data = $result['data'] ?? [];
        $status = strtolower((string) ($data['status'] ?? ''));

        if ($status === 'success') {
            $this->markPaid($payment, $order, $data, $push);
            return response()->json([
                'status' => 'success',
                'order' => $order->fresh(['items.product', 'user']),
            ]);
        }

        return response()->json([
            'status' => $status ?: 'pending',
            'message' => $result['message'] ?? 'Payment not completed yet.',
            'order' => $order->load('items.product'),
        ]);
    }

    /**
     * Chapa webhook/callback — unauthenticated; verified via Chapa verify API.
     */
    public function webhook(Request $request, ChapaService $chapa, PushNotificationService $push)
    {
        // Chapa may send form fields, JSON, or nested data.* on GET/POST
        $txRef = $request->input('trx_ref')
            ?? $request->input('tx_ref')
            ?? $request->input('data.tx_ref')
            ?? $request->input('data.trx_ref')
            ?? $request->query('trx_ref')
            ?? $request->query('tx_ref');

        if (!$txRef && $request->getContent()) {
            $json = json_decode($request->getContent(), true);
            if (is_array($json)) {
                $txRef = $json['trx_ref']
                    ?? $json['tx_ref']
                    ?? ($json['data']['tx_ref'] ?? null)
                    ?? ($json['data']['trx_ref'] ?? null);
            }
        }

        if (!$txRef) {
            Log::info('Chapa webhook missing tx_ref', [
                'keys' => array_keys($request->all()),
                'query' => $request->query(),
            ]);
            return response()->json(['message' => 'Missing tx_ref'], 400);
        }

        $payment = Payment::where('tx_ref', $txRef)->first();
        if (!$payment) {
            return response()->json(['message' => 'Unknown payment'], 404);
        }

        if ($payment->status === 'success') {
            return response()->json(['message' => 'Already processed']);
        }

        try {
            $result = $chapa->verify($txRef);
        } catch (\Throwable $e) {
            Log::warning('Chapa webhook verify failed', ['tx_ref' => $txRef, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Verify failed'], 502);
        }

        $data = $result['data'] ?? [];
        $status = strtolower((string) ($data['status'] ?? ''));

        if ($status === 'success') {
            $order = Order::find($payment->order_id);
            if ($order) {
                $this->markPaid($payment, $order, $data, $push);
            }
        } elseif (in_array($status, ['failed', 'cancelled'], true)) {
            $payment->update([
                'status' => 'failed',
                'raw_payload' => $data,
            ]);
            Order::where('id', $payment->order_id)
                ->where('payment_status', '!=', 'paid')
                ->update(['payment_status' => 'failed']);
        }

        return response()->json(['message' => 'ok']);
    }

    /**
     * Idempotent paid transition with row locks + amount integrity check.
     */
    protected function markPaid(Payment $payment, Order $order, array $chapaData, PushNotificationService $push): void
    {
        $alreadyPaid = false;

        DB::transaction(function () use ($payment, $order, $chapaData, &$alreadyPaid) {
            $payment = Payment::where('id', $payment->id)->lockForUpdate()->first();
            $order = Order::where('id', $order->id)->lockForUpdate()->first();

            if (!$payment || !$order) {
                return;
            }

            if ($payment->status === 'success' || $order->payment_status === 'paid') {
                $alreadyPaid = true;
                return;
            }

            // Never trust client: amount from provider must match order total
            $paidAmount = isset($chapaData['amount'])
                ? (string) $chapaData['amount']
                : null;

            if ($paidAmount !== null && bccomp($paidAmount, (string) $order->total_amount, 2) !== 0) {
                Log::error('Chapa amount mismatch', [
                    'order_id' => $order->id,
                    'expected' => $order->total_amount,
                    'got' => $paidAmount,
                    'tx_ref' => $payment->tx_ref,
                ]);
                $payment->update([
                    'status' => 'amount_mismatch',
                    'raw_payload' => $chapaData,
                ]);
                return;
            }

            $currency = strtoupper((string) ($chapaData['currency'] ?? 'ETB'));
            if ($currency !== 'ETB') {
                Log::error('Chapa currency mismatch', ['order_id' => $order->id, 'currency' => $currency]);
                $payment->update([
                    'status' => 'currency_mismatch',
                    'raw_payload' => $chapaData,
                ]);
                return;
            }

            $payment->update([
                'status' => 'success',
                'provider_reference' => $chapaData['reference'] ?? $chapaData['ref_id'] ?? null,
                'raw_payload' => $chapaData,
            ]);

            $updates = [
                'payment_status' => 'paid',
                'payment_reference' => $chapaData['reference'] ?? $chapaData['ref_id'] ?? null,
                'payment_tx_ref' => $payment->tx_ref,
                'paid_at' => now(),
            ];

            if ($order->status === 'pending') {
                $updates['status'] = 'confirmed';
            }

            $order->update($updates);
        });

        if ($alreadyPaid) {
            return;
        }

        $order->refresh()->load('user');

        if ($order->payment_status !== 'paid') {
            return;
        }

        try {
            if ($order->user) {
                $push->sendToUser(
                    $order->user,
                    'Payment received',
                    'Order #' . $order->id . ' is paid. Thank you!',
                    ['type' => 'payment_success', 'order_id' => (string) $order->id]
                );
            }
            $push->notifyAdmins(
                'New paid order',
                'Order #' . $order->id . ' · ETB ' . $order->total_amount,
                ['type' => 'order_paid', 'order_id' => (string) $order->id]
            );
        } catch (\Throwable $e) {
            Log::warning('Payment push failed: ' . $e->getMessage());
        }
    }
}
