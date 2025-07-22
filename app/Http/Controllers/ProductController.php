<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use App\Traits\HasFile;
use Illuminate\Http\Request;
use Inertia\Response;

class ProductController extends Controller
{
    use HasFile;

    public function index(): Response
    {
        $products = Product::query()
            ->select([
                'id',
                'company_id',
                'category_id',
                'unit_id',
                'name',
                'slug',
                'sku',
                'price',
                'cost',
                'profit',
                'stock',
                'min_stock',
                'image',
                'created_at'
            ])
            ->filter(request()->only('search'))
            ->sorting(request()->only(['field', 'direction']))
            ->with(['category'])
            ->latest('created_at')
            ->paginate(request()->load ?? 10)
            ->withQueryString();

        return inertia('Front/Products/Index', [
            'products' => ProductResource::collection($products)->additional([
                'meta' => [
                    'has_pages' => $products->hasPages(),
                ],
            ]),
            'page_settings' => [
                'title' => 'Produk',
                'subtitle' => 'Menampilkan semua data produk yang tersedia pada platform ini',
            ],
            'state' => [
                'page' => request()->page ?? 1,
                'search' => request()->search ?? '',
                'load' => 10,
            ],
        ]);
    }
    public function create(): Response
    {
        return inertia('Front/Products/Create', [
            'page_settings' => [
                'title' => 'Tambah Produk',
                'subtitle' => 'Buat produk baru disini. Klik simpan setelah selesai',
                'method' => 'POST',
                'action' => route('front.products.store'),
            ],
            'page_data' => [
                'categories' => Category::query()->select(['id', 'name'])->get()->map(fn ($item) => [
                    'value' => $item->id,
                    'label' => $item->name,
                ]),
                'units' => Unit::query()->select(['id', 'name'])->get()->map(fn ($item) => [
                    'value' => $item->id,
                    'label' => $item->name,
                ]),
            ],
        ]);
    }
}
