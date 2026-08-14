<?php
namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Admin is the store seller. Products are owned by the acting admin.
 */
class ProductController extends Controller
{
    public function index()
    {
        return Product::with(['category', 'seller:id,name,email'])
            ->where('active', true)
            ->where('stock_quantity', '>', 0)
            ->latest()
            ->paginate(30);
    }

    public function adminIndex()
    {
        return Product::with(['category', 'seller:id,name,email'])
            ->latest()
            ->paginate(50);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:10000',
            'price' => 'required|numeric|min:0.01|max:99999999.99',
            'stock_quantity' => 'required|integer|min:0',
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        $path = $request->file('image')->store('products', 'public');

        // Admin is the seller — ignore any client seller_id
        $product = Product::create([
            'category_id' => $data['category_id'],
            'seller_id' => $request->user()->id,
            'title' => $data['title'],
            'description' => $data['description'],
            'price' => $data['price'],
            'stock_quantity' => $data['stock_quantity'],
            'image_url' => Storage::disk('public')->url($path),
            'active' => true,
        ]);

        return response()->json($product->load(['category', 'seller:id,name,email']), 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        if ($request->has('active')) {
            $request->merge([
                'active' => filter_var($request->input('active'), FILTER_VALIDATE_BOOLEAN),
            ]);
        }

        $data = $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:10000',
            'price' => 'sometimes|numeric|min:0.01|max:99999999.99',
            'stock_quantity' => 'sometimes|integer|min:0',
            'active' => 'sometimes|boolean',
            'image' => 'sometimes|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        // Never accept seller_id from client — keep admin ownership
        unset($data['seller_id']);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $data['image_url'] = Storage::disk('public')->url($path);
            unset($data['image']);
        }

        // Ensure product remains tied to an admin if seller_id missing
        if (!$product->seller_id && $request->user()) {
            $data['seller_id'] = $request->user()->id;
        }

        $product->update($data);

        return $product->fresh(['category', 'seller:id,name,email']);
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);

        $hasOrders = \App\Models\OrderItem::where('product_id', $product->id)->exists();
        if ($hasOrders) {
            $product->update(['active' => false, 'stock_quantity' => 0]);
            return response()->json(['message' => 'Product deactivated (has order history).']);
        }

        $product->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
