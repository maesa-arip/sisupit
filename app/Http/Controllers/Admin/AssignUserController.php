<?php

namespace App\Http\Controllers\Admin;

use App\Enums\MessageType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignUserRequest;
use App\Http\Resources\Admin\AssignUserResource;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class AssignUserController extends Controller
{
    public function index(): Response
    {
        $users = User::query()
            ->select(['id', 'email', 'username'])
            ->when(request()->search, function ($query, $search) {
                $query->whereAny([
                    'email',
                    'username',
                ], 'REGEXP', $search);
            })
            ->when(request()->field && request()->direction, fn ($query) => $query->orderBy(request()->field, request()->direction))
            ->with('roles')
            ->paginate(request()->load ?? 10)
            ->withQueryString();

        return inertia('Admin/AssignUsers/Index', [
            'page_settings' => [
                'title' => 'Tetapkan Peran',
                'subtitle' => 'menamplikan semua data tetapkan peran yang tersedia',
            ],
            'users' => AssignUserResource::collection($users)->additional([
                'meta' => [
                    'has_pages' => $users->hasPages(),
                ],
            ]),
            'state' => [
                'page' => request()->page ?? 1,
                'search' => request()->search ?? '',
                'load' => 10,
            ],
        ]);
    }

    public function edit(User $user)
    {
        return inertia('Admin/AssignUsers/Edit', [
            'page_settings' => [
                'title' => 'Sinkronisasi Peran',
                'subtitle' => 'menamplikan semua data sinkronisasi peran yang tersedia',
                'method' => 'PUT',
                'action' => route('admin.assign-users.update', $user),
            ],
            'user' => $user->load('roles'),
            'roles' => Role::query()->select(['id', 'name'])->where('guard_name', 'web')->get()->map(fn ($item) => [
                'value' => $item->id,
                'label' => $item->name,
            ]),
        ]);
    }

    public function update(User $user, AssignUserRequest $request): RedirectResponse
    {
        try {
            $user->syncRoles($request->roles);
            flashMessage("Berhasil sinkronisasi peran ke pengguna {$user->name}");

            return to_route('admin.assign-users.index');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');

            return to_route('admin.assign-users.index');
        }
    }
}
