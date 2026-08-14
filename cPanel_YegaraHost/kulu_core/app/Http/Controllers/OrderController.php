<?php
namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class OrderController extends Controller
{
    public function store(Request $request, PushNotificationService $push)
    {
        $data = $request->validate([
            'shipping_name' => 'required|string|max:255',
            'shipping_phone' => 'required|string|max:50',
            'shipping_address' => 'required|string|max:2000',
            'items' => 'required|array|min:1|max:50',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1|max:999',
        ]);

        // Merge duplicate product lines from client
        $merged = [];
        foreach ($data['items'] as $item) {
            $pid = (int) $item['product_id'];
            $merged[$pid] = ($merged[$pid] ?? 0) + (int) $item['quantity'];
        }

        $order = DB::transaction(function () use ($merged, $data, $request) {
            $total = '0.00';
            $rows = [];

            foreach ($merged as $productId => $qty) {
                $product = Product::lockForUpdate()->findOrFail($productId);

                if (!$product->active) {
                    abort(422, 'Product is not available: ' . $product->title);
                }
                if ($product->stock_quantity < $qty) {
                    abort(422, 'Insufficient stock for ' . $product->title);
                }

                $line = bcmul((string) $product->price, (string) $qty, 2);
                $total = bcadd($total, $line, 2);

                $rows[] = [
                    'product_id' => $product->id,
                    'quantity' => $qty,
                    'unit_price' => $product->price,
                ];

                $product->decrement('stock_quantity', $qty);
            }

            if (bccomp($total, '0', 2) !== 1) {
                abort(422, 'Order total must be greater than zero.');
            }

            $payload = [
                'user_id' => $request->user()->id,
                'total_amount' => $total,
                'status' => 'pending',
                'shipping_name' => $data['shipping_name'],
                'shipping_phone' => $data['shipping_phone'],
                'shipping_address' => $data['shipping_address'],
            ];

            if (Schema::hasColumn('orders', 'payment_status')) {
                $payload['payment_status'] = 'unpaid';
            }

            $order = Order::create($payload);
            $order->items()->createMany($rows);

            return $order;
        });

        $order->load('items.product');

        try {
            $push->notifyAdmins(
                'New order #' . $order->id,
                $request->user()->name . ' ordered ETB ' . $order->total_amount,
                [
                    'type' => 'new_order',
                    'order_id' => (string) $order->id,
                    'status' => $order->status,
                ]
            );
        } catch (\Throwable $e) {
            // never fail order on push
        }

        return response()->json($order, 201);
    }

    public function mine(Request $request)
    {
        return Order::with('items.product')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);
    }

    public function show(Request $request, $id)
    {
        $order = Order::with('items.product')->findOrFail($id);

        // Ownership: customer can only see own; admin can see any
        if ($request->user()->role !== 'admin' && $order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return $order;
    }

    public function index()
    {
        return Order::with(['user', 'items.product'])
            ->latest()
            ->paginate(30);
    }

    public function updateStatus(Request $request, $id, PushNotificationService $push)
    {
        $data = $request->validate([
            'status' => 'required|in:pending,confirmed,processing,shipped,delivered,cancelled',
        ]);

        $order = DB::transaction(function () use ($data, $id) {
            $order = Order::with('items')->lockForUpdate()->findOrFail($id);
            $previous = $order->status;
            $next = $data['status'];

            if ($previous === $next) {
                return $order;
            }

            // Paid orders: allow cancel only with explicit awareness (stock restore still happens)
            // Block reactivating cancelled
            if ($previous === 'cancelled' && $next !== 'cancelled') {
                abort(422, 'Cancelled orders cannot be reactivated. Create a new order if needed.');
            }

            // Delivered should not go backwards except cancel is blocked after delivered for simplicity
            $rank = [
                'pending' => 1,
                'confirmed' => 2,
                'processing' => 3,
                'shipped' => 4,
                'delivered' => 5,
                'cancelled' => 0,
            ];

            if ($next !== 'cancelled' && ($rank[$next] ?? 0) < ($rank[$previous] ?? 0)) {
                abort(422, 'Invalid status transition from ' . $previous . ' to ' . $next . '.');
            }

            if ($next === 'cancelled' && $previous !== 'cancelled') {
                foreach ($order->items as $item) {
                    Product::where('id', $item->product_id)
                        ->lockForUpdate()
                        ->increment('stock_quantity', $item->quantity);
                }
            }

            $order->update(['status' => $next]);

            return $order;
        });

        $order->load(['user', 'items.product']);

        try {
            if ($order->user) {
                $push->sendToUser(
                    $order->user,
                    'Order update',
                    'Order #' . $order->id . ' is now ' . $order->status . '.',
                    [
                        'type' => 'order_status',
                        'order_id' => (string) $order->id,
                        'status' => $order->status,
                    ]
                );
            }
        } catch (\Throwable $e) {
            // ignore
        }

        return $order;
    }
}
