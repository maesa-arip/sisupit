<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\ReturnFineSingleResource;
use App\Models\ReturnBook;
use Inertia\Response;

class FineController extends Controller
{
    public function create(ReturnBook $returnBook): Response
    {
        return inertia('Admin/Fines/Create', [
            'page_settings' => [
                'title' => 'Denda',
                'subtitle' => 'Selesaikan pembayaran denda terlebih dahulu',
                // 'method' => 'POST',
                // 'action' => route('admin.categories.store'),
            ],
            'return_book' => new ReturnFineSingleResource($returnBook->load([
                'book',
                'fine',
                'loan',
                'user',
                'returnBookCheck',
            ])),
        ]);
    }
}
