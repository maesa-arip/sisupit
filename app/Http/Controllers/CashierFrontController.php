<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CashierFrontController extends Controller
{
    public function index()
    {
        return inertia('Front/Cashier/Index', [
            // 'categories' => CategoryFrontResource::collection($categories)->additional([
            //     'meta' => [
            //         'has_pages' => $categories->hasPages(),
            //     ],
            // ]),
            'page_settings' => [
                'title' => 'Kasir',
                'subtitle' => 'Transaksi Point Of Sales dihalaman ini',
            ],
        ]);
    }
}
