<?php

namespace App\Http\Controllers;

use App\Http\Resources\FineFrontResource;
use App\Models\Fine;

class FineFrontController extends Controller
{
    public function __invoke()
    {
        $fines = Fine::query()
            ->select(['id', 'return_book_id', 'user_id', 'late_fee', 'other_fee', 'total_fee', 'fine_date', 'payment_status', 'created_at'])
            ->with(['user', 'returnBook'])
            ->where('user_id', auth()->user()->id)
            ->paginate(10)
            ->withQueryString();

        return inertia('Front/Fines/Index', [
            'page_settings' => [
                'title' => 'Laporan Denda',
                'subtitle' => 'Menmpilkan laporan denda anda yang tersedia pada platform ini',
            ],
            'fines' => FineFrontResource::collection($fines)->additional([
                'meta' => [
                    'has_pages' => $fines->hasPages(),
                ],
            ]),
        ]);
    }
}
