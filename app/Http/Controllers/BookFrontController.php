<?php

namespace App\Http\Controllers;

use App\Http\Resources\BookFrontSingleResource;
use App\Http\Resources\CategoryFrontResource;
use App\Models\Book;
use App\Models\Category;
use Inertia\Response;

class BookFrontController extends Controller
{
    public function index(): Response
    {
        $categories = Category::query()
            ->select(['id', 'name',  'slug', 'cover', 'created_at'])
            ->whereHas('books')
            ->with([
                'books' => fn ($query) => $query->limit(4),
            ])
            ->latest('created_at')
            ->get();

        return inertia('Front/Books/Index', [
            'categories' => CategoryFrontResource::collection($categories),
            'page_settings' => [
                'title' => 'Buku',
                'subtitle' => 'Menampilkan semua data buku yang tersedia pada platform ini',
            ],
        ]);
    }

    public function show(Book $book): Response
    {
        return inertia('Front/Books/Show', [
            'page_settings' => [
                'title' => $book->title,
                'subtitle' => "Menampilkan detail informasi buku {$book->title}",
            ],
            'book' => new BookFrontSingleResource($book->load(['category', 'publisher', 'stock'])),
        ]);
    }
}
