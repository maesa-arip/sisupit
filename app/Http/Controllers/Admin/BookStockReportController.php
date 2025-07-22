<?php

namespace App\Http\Controllers\Admin;

use App\Enums\MessageType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StockRequest;
use App\Http\Resources\Admin\StockResource;
use App\Models\Stock;
use Illuminate\Http\RedirectResponse;
use Inertia\Response;

class BookStockReportController extends Controller
{
    public function index(): Response
    {
        $stocks = Stock::query()
            ->select(['stocks.id', 'book_id', 'total', 'available', 'loan', 'lost', 'damaged', 'stocks.created_at'])
            ->filter(request()->only(['search']))
            ->sorting(request()->only(['field', 'direction']))
            ->paginate(request()->load ?? 10)
            ->withQueryString();

        return inertia('Admin/BookStockReports/Index', [
            'page_settings' => [
                'title' => 'Laporan Stock Buku',
                'subtitle' => 'Menampilkan laporan stock buku yang tersedia pada platform ini',
            ],
            'stocks' => StockResource::collection($stocks)->additional([
                'meta' => [
                    'has_pages' => $stocks->hasPages(),
                ],
            ]),
            'state' => [
                'page' => request()->page ?? 1,
                'search' => request()->search ?? '',
                'load' => request()->load ?? 10,
            ],
        ]);
    }

    public function edit(Stock $stock): Response
    {
        return inertia('Admin/BookStockReports/Edit', [
            'page_settings' => [
                'title' => 'Edit Stok',
                'subtitle' => 'Edit stok buku disini. Klik simpan setelah selesai',
                'method' => 'PUT',
                'action' => route('admin.book-stock-reports.update', $stock),
            ],
            'stock' => $stock,
        ]);
    }

    public function update(Stock $stock, StockRequest $request): RedirectResponse
    {
        try {
            $minimum_total = $request->available + $request->loan + $request->lost + $request->damaged;
            if ($request->total < $minimum_total) {
                flashMessage('Total tidak boleh lebih kecil dari peminjaman yang tersedia, dipinjam, hilang, dan rusak.', 'error');

                return to_route('admin.book-stock-reports.index');
            }
            $stock->update([
                'total' => $request->total,
                'available' => $request->available,
            ]);
            flashMessage(MessageType::UPDATED->message('Stok'));

            return to_route('admin.book-stock-reports.index');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessae()), 'error');

            return to_route('admin.book-stock-reports.index');
        }
    }
}
