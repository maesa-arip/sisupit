<?php

namespace App\Http\Controllers;

use App\Http\Resources\LoanFrontResource;
use App\Http\Resources\LoanFrontSingleResource;
use App\Models\Book;
use App\Models\Loan;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Response;

class LoanFrontController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('password.confirm', except: ['store']),
        ];
    }

    public function index(): Response
    {
        $loans = Loan::query()
            ->select(['id', 'loan_code', 'user_id', 'book_id', 'loan_date', 'due_date', 'created_at'])
            ->where('user_id', auth()->user()->id)
            ->filter(request()->only('search'))
            ->sorting(request()->only(['field', 'direction']))
            ->with(['book', 'user'])
            ->latest('created_at')
            ->paginate(request()->load ?? 10)
            ->withQueryString();

        return inertia('Front/Loans/Index', [
            'loans' => LoanFrontResource::collection($loans)->additional([
                'meta' => [
                    'has_pages' => $loans->hasPages(),
                ],
            ]),
            'page_settings' => [
                'title' => 'Peminjaman',
                'subtitle' => 'Menampilkan semua data peminjaman anda yang tersedia pada platform ini',
            ],
            'state' => [
                'page' => request()->page ?? 1,
                'search' => request()->search ?? '',
                'load' => 10,
            ],
        ]);
    }

    public function store(Book $book): RedirectResponse
    {
        if (Loan::checkLoanBook(auth()->user()->id, $book->id)) {
            flashMessage('Anda sudah meminjam buku ini, harap kembalikan bukunya terlebih dahulu', 'error');

            return to_route('front.books.show', $book->slug);
        }
        if ($book->stock->available <= 0) {
            flashMessage('Stok buku tidak tersedia', 'error');

            return to_route('front.books.show', $book->slug);
        }
        $loan = tap(Loan::create([
            'loan_code' => str()->lower(str()->random(10)),
            'user_id' => auth()->user()->id,
            'book_id' => $book->id,
            'loan_date' => Carbon::now()->toDateString(),
            'due_date' => Carbon::now()->addDays(7)->toDateString(),
        ]), function ($loan) {
            $loan->book->stock_loan();
            flashMessage('Berhasil melakukan peminjaman buku');
        });

        return to_route('front.loans.index');
    }

    public function show(Loan $loan): Response
    {
        return inertia('Front/Loans/Show', [
            'loan' => new LoanFrontSingleResource($loan->load(['book', 'user', 'returnBook'])),
            'page_settings' => [
                'title' => 'Detail peminjaman buku',
                'subtitle' => 'Melihat informasi detail buku yang anda pinjam',
            ],
        ]);
    }
}
