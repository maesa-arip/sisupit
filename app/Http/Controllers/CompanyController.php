<?php

namespace App\Http\Controllers;

use App\Enums\MessageType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Http\Requests\CompanyRequest;
use App\Http\Resources\Admin\CategoryResource;
use App\Http\Resources\CompanyResource;
use App\Models\Category;
use App\Models\Company;
use App\Traits\HasFile;
use Illuminate\Http\RedirectResponse;
use Inertia\Response;

class CompanyController extends Controller
{
    use HasFile;

    public function index(): Response
    {
        $companies = Company::query()
            ->select(['id', 'name','slug', 'logo', 'created_at'])
            ->where('user_id',auth()->user()->id)
            ->filter(request()->only(['search']))
            ->sorting(request()->only(['field', 'direction']))
            ->paginate(request()->load ?? 10)
            ->withQueryString();

        return inertia('Front/Companies/Index', [
            'companies' => CompanyResource::collection($companies)->additional([
                'meta' => [
                    'has_pages' => $companies->hasPages(),
                ],
            ]),
            'page_settings' => [
                'title' => 'Perusahaan',
                'subtitle' => 'Menampilkan semua data perusahaan yang anda miliki pada platform ini',
            ],
            'state' => [
                'page' => request()->page ?? 1,
                'search' => request()->search ?? '',
                'load' => request()->load ?? 10,
            ],
        ]);
    }

    public function create(): Response
    {
        return inertia('Front/Companies/Create', [
            'page_settings' => [
                'title' => 'Tambah Perusahaan',
                'subtitle' => 'Buat perusahaan baru disini. Klik simpan setelah selesai',
                'method' => 'POST',
                'action' => route('front.companies.store'),
            ],
        ]);
    }

    public function store(CompanyRequest $request): RedirectResponse
    {
        try {
            Company::create([
                'name' => $name = $request->name,
                'user_id' => auth()->user()->id,
                'slug' => str()->lower(str()->slug($name) . str()->random(4)),
                'logo' => $this->upload_file($request, 'logo', 'companies'),
            ]);
            flashMessage(MessageType::CREATED->message('Perusahaan'));

            return to_route('front.companies.index');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');

            return to_route('front.companies.index');
        }
    }

    public function edit(Company $company): Response
    {
        return inertia('Front/Companies/Edit', [
            'page_settings' => [
                'title' => 'Edit Perusahaan',
                'subtitle' => 'Edit perusahaan disini. Klik simpan setelah selesai',
                'method' => 'PUT',
                'action' => route('front.companies.update', $company),
            ],
            'company' => $company,
        ]);
    }

    public function update(Company $company, CompanyRequest $request): RedirectResponse
    {
        try {
            $company->update([
                'name' => $name = $request->name,
                'slug' => $name !== $company->name ? str()->lower(str()->slug($name) . str()->random(4)) : $company->slug,
                'logo' => $this->update_file($request, $company, 'logo', 'companies'),
            ]);
            flashMessage(MessageType::UPDATED->message('Perusahaan'));

            return to_route('front.companies.index');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessae()), 'error');

            return to_route('front.companies.index');
        }
    }

    public function destroy(Company $company): RedirectResponse
    {
        try {
            $this->delete_file($company, 'logo');
            $company->delete();
            flashMessage(MessageType::DELETED->message('Perusahaan'));

            return to_route('front.companies.index');
        } catch (\Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessae()), 'error');

            return to_route('front.companies.index');
        }
    }
}
