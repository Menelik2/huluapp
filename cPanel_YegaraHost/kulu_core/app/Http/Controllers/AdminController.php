<?php
namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

/**
 * Admin = store owner / seller. Only two roles exist: user and admin.
 */
class AdminController extends Controller
{
    public function overview()
    {
        if (Schema::hasColumn('orders', 'payment_status')) {
            $sales = Order::where('payment_status', 'paid')->sum('total_amount');
        } else {
            $sales = Order::whereIn('status', ['confirmed', 'processing', 'shipped', 'delivered'])
                ->sum('total_amount');
        }

        return [
            'products' => Product::count(),
            'categories' => Category::count(),
            'customers' => User::where('role', User::ROLE_USER)->count(),
            'admins' => User::where('role', User::ROLE_ADMIN)->count(),
            'orders' => Order::count(),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'sales' => $sales,
        ];
    }

    public function analytics()
    {
        $salesByDay = Order::selectRaw('DATE(created_at) as day, SUM(total_amount) as total')
            ->where('created_at', '>=', now()->subDays(30));

        if (Schema::hasColumn('orders', 'payment_status')) {
            $salesByDay->where('payment_status', 'paid');
        } else {
            $salesByDay->whereIn('status', ['confirmed', 'processing', 'shipped', 'delivered']);
        }

        return [
            'orders_by_status' => Order::selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->get(),
            'sales_by_day' => $salesByDay->groupBy('day')->orderBy('day')->get(),
        ];
    }

    public function inventory()
    {
        return Product::with('category')
            ->orderBy('stock_quantity')
            ->paginate(50);
    }

    public function updateInventory(Request $request, $productId)
    {
        $data = $request->validate([
            'stock_quantity' => 'required|integer|min:0',
        ]);

        $product = Product::findOrFail($productId);
        $product->update($data);

        return $product->fresh('category');
    }

    public function customers()
    {
        return User::where('role', User::ROLE_USER)
            ->withCount('orders')
            ->latest()
            ->paginate(30);
    }

    public function chatUsers()
    {
        return User::where('role', User::ROLE_USER)
            ->withCount('orders')
            ->orderByDesc('orders_count')
            ->orderByDesc('id')
            ->limit(100)
            ->get(['id', 'name', 'email', 'avatar']);
    }

    /**
     * Seller/store reports for the admin owner.
     */
    public function reports()
    {
        $paidQuery = Order::query();
        if (Schema::hasColumn('orders', 'payment_status')) {
            $paidQuery->where('payment_status', 'paid');
            $revenue = (clone $paidQuery)->sum('total_amount');
            $paidOrders = (clone $paidQuery)->count();
        } else {
            $paidQuery->whereIn('status', ['confirmed', 'processing', 'shipped', 'delivered']);
            $revenue = (clone $paidQuery)->sum('total_amount');
            $paidOrders = (clone $paidQuery)->count();
        }

        $unitsSold = \App\Models\OrderItem::query()
            ->whereIn('order_id', (clone $paidQuery)->select('id'))
            ->sum('quantity');

        $topProducts = \App\Models\OrderItem::query()
            ->selectRaw('product_id, SUM(quantity) as units, SUM(price * quantity) as revenue')
            ->whereIn('order_id', Order::query()->when(
                Schema::hasColumn('orders', 'payment_status'),
                fn ($q) => $q->where('payment_status', 'paid'),
                fn ($q) => $q->whereIn('status', ['confirmed', 'processing', 'shipped', 'delivered'])
            )->select('id'))
            ->groupBy('product_id')
            ->orderByDesc('units')
            ->limit(10)
            ->with('product:id,title,stock_quantity,price')
            ->get();

        $lowStock = Product::where('active', true)
            ->where('stock_quantity', '<=', 5)
            ->orderBy('stock_quantity')
            ->limit(20)
            ->get(['id', 'title', 'stock_quantity', 'price']);

        $byStatus = Order::selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->get();

        $salesByDay = Order::selectRaw('DATE(created_at) as day, SUM(total_amount) as total')
            ->where('created_at', '>=', now()->subDays(30));
        if (Schema::hasColumn('orders', 'payment_status')) {
            $salesByDay->where('payment_status', 'paid');
        } else {
            $salesByDay->whereIn('status', ['confirmed', 'processing', 'shipped', 'delivered']);
        }

        return [
            'revenue_paid' => $revenue,
            'orders_paid' => $paidOrders,
            'orders_total' => Order::count(),
            'units_sold' => (int) $unitsSold,
            'customers' => User::where('role', User::ROLE_USER)->count(),
            'products_active' => Product::where('active', true)->count(),
            'top_products' => $topProducts,
            'low_stock' => $lowStock,
            'orders_by_status' => $byStatus,
            'sales_by_day' => $salesByDay->groupBy('day')->orderBy('day')->get(),
        ];
    }

}
