<?php
namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        return Category::withCount('products')->orderBy('name')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
        ]);
        return response()->json(Category::create($data), 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $id,
        ]);
        $category = Category::findOrFail($id);
        $category->update($data);
        return $category;
    }

    public function destroy($id)
    {
        $category = Category::withCount('products')->findOrFail($id);
        if ($category->products_count > 0) {
            return response()->json([
                'message' => 'Category has products. Move or delete products first.',
            ], 422);
        }
        $category->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
