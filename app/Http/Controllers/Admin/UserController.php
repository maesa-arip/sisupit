<?php

namespace App\Http\Controllers\Admin;

use App\Enums\MessageType;
use App\Enums\UserGender;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserRequest;
use App\Http\Resources\Admin\UserResource;
use App\Models\User;
use App\Traits\HasFile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Inertia\Response;

class UserController extends Controller
{
    use HasFile;

    public function index(): Response
    {
        $users = User::query()
            ->select(['id', 'name', 'username', 'email', 'phone', 'avatar', 'gender', 'date_of_birth', 'address', 'created_at'])
            ->filter(request()->only(['search']))
            ->sorting(request()->only(['field', 'direction']))
            ->latest('created_at')
            ->paginate(request()->load ?? 10)
            ->withQueryString();

        return inertia('Admin/Users/Index', [
            'users' => UserResource::collection($users)->additional([
                'meta' => [
                    'has_pages' => $users->hasPages(),
                ],
            ]),
            'page_settings' => [
                'title' => 'Pengguna',
                'subtitle' => 'Menampilkan semua data pengguna yang tersedia pada platform ini',
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
        return inertia('Admin/Users/Create', [
            'page_settings' => [
                'title' => 'Tambah Pengguna',
                'subtitle' => 'Buat pengguna baru disini. Klik simpan setelah selesai',
                'method' => 'POST',
                'action' => route('admin.users.store'),
            ],
            'genders' => UserGender::options(),
        ]);
    }

    public function store(UserRequest $request): RedirectResponse
    {
        try {
            $user = User::create([
                'name' => $name = $request->name,
                'username' => usernameGenerator($name),
                'address' => $request->address,
                'email' => $request->email,
                'phone' => $request->phone,
                'gender' => $request->gender,
                'date_of_birth' => $request->date_of_birth,
                'password' => Hash::make(request()->password),
                'avatar' => $this->upload_file($request, 'avatar', 'users'),
            ]);
            flashMessage(MessageType::CREATED->message('Pengguna'));

            return to_route('admin.users.index');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');

            return to_route('admin.users.index');
        }
    }

    public function edit(User $user): Response
    {
        return inertia('Admin/Users/Edit', [
            'page_settings' => [
                'title' => 'Edit Pengguna',
                'subtitle' => 'Edit pengguna disini. Klik simpan setelah selesai',
                'method' => 'PUT',
                'action' => route('admin.users.update', $user),
            ],
            'genders' => UserGender::options(),
            'user' => $user,
        ]);
    }

    public function update(UserRequest $request, User $user): RedirectResponse
    {
        try {
            $user->update([
                'name' => $name = $request->name,
                'username' => usernameGenerator($name),
                'address' => $request->address,
                'gender' => $request->gender,
                'email' => $request->email,
                'phone' => $request->phone,
                'date_of_birth' => $request->date_of_birth,
                'password' => Hash::make(request()->password),
                'avatar' => $this->update_file($request, $user, 'avatar', 'users'),
            ]);
            flashMessage(MessageType::UPDATED->message('Pengguna'));

            return to_route('admin.users.index');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');

            return to_route('admin.users.index');
        }
    }

    public function destroy(User $user): RedirectResponse
    {
        try {
            $this->delete_file($user, 'cover');
            $user->delete();
            flashMessage(MessageType::DELETED->message('Pengguna'));

            return to_route('admin.users.index');
        } catch (\Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessae()), 'error');

            return to_route('admin.users.index');
        }
    }

    public function store_relawan(User $user)
    {
        try {
            $user->assignRole(2);
            flashMessage(MessageType::UPDATED->message('Relawan'));
            return redirect()->route('dashboard');
            // return to_route('dashboard');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');

            return to_route('dashboard');
        }

        

    }

    public function store_detail_user(UserRequest $request,User $user)
   {
        try {
            $user->update([
                'name' => $name = $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'ktp' => $this->update_file($request, $user, 'ktp', 'users'),
            ]);
            flashMessage(MessageType::UPDATED->message('Profil'));

            return to_route('profile.edit');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');

            return to_route('profile.edit');
        }
    }
}
