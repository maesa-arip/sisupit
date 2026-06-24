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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Response;

class UserController extends Controller
{
    use HasFile;

    public function index(): Response
    {
        $users = User::query()
            ->select(['id', 'name', 'username', 'email', 'phone', 'avatar', 'gender', 'date_of_birth', 'address', 'created_at', 'province_code', 'city_code', 'district_code', 'village_code'])
            ->with(['roles:id,name', 'province:code,name', 'city:code,name', 'district:code,name', 'village:code,name'])
            ->isAdmin()
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
        $admin = auth()->user();

        return inertia('Admin/Users/Create', [
            'page_settings' => [
                'title' => 'Tambah Pengguna',
                'subtitle' => 'Buat pengguna baru disini. Klik simpan setelah selesai',
                'method' => 'POST',
                'action' => route('admin.users.store'),
            ],
            'genders' => UserGender::options(),
            ...$this->regionFormProps($admin),
        ]);
    }

    public function store(UserRequest $request): RedirectResponse
    {
        $admin = auth()->user();

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
                'province_code' => $admin->province_code ?? $request->province_code,
                'city_code' => $admin->city_code ?? $request->city_code,
                'district_code' => $admin->district_code ?? $request->district_code,
                'village_code' => $admin->village_code ?? $request->village_code,
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
        $this->authorize('view', $user);

        $admin = auth()->user();

        return inertia('Admin/Users/Edit', [
            'page_settings' => [
                'title' => 'Edit Pengguna',
                'subtitle' => 'Edit pengguna disini. Klik simpan setelah selesai',
                'method' => 'PUT',
                'action' => route('admin.users.update', $user),
            ],
            'genders' => UserGender::options(),
            'user' => $user,
            ...$this->regionFormProps($admin, $user),
        ]);
    }

    public function update(UserRequest $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $admin = auth()->user();

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
                'province_code' => $admin->province_code ?? $request->province_code,
                'city_code' => $admin->city_code ?? $request->city_code,
                'district_code' => $admin->district_code ?? $request->district_code,
                'village_code' => $admin->village_code ?? $request->village_code,
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
        $this->authorize('delete', $user);

        try {
            $this->delete_file($user, 'avatar');
            $user->delete();
            flashMessage(MessageType::DELETED->message('Pengguna'));

            return to_route('admin.users.index');
        } catch (\Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');

            return to_route('admin.users.index');
        }
    }

    /**
     * Siapkan opsi wilayah & status kunci yurisdiksi untuk form Create/Edit,
     * mengikuti pola yang sama dengan HydrantController agar pengguna baru
     * otomatis terikat ke wilayah admin yang membuatnya.
     */
    private function regionFormProps(User $admin, ?User $target = null): array
    {
        $provinces = [];
        $cities = [];
        $districts = [];
        $targetProvinceCode = null;

        if (! $admin->province_code) {
            $provinces = DB::table('indonesia_provinces')->get();
            if ($target?->city_code) {
                $targetProvinceCode = DB::table('indonesia_cities')->where('code', $target->city_code)->value('province_code');
                $cities = DB::table('indonesia_cities')->where('province_code', $targetProvinceCode)->get();
                $districts = DB::table('indonesia_districts')->where('city_code', $target->city_code)->get();
            }
        } elseif (! $admin->city_code) {
            $cities = DB::table('indonesia_cities')->where('province_code', $admin->province_code)->get();
            if ($target?->city_code) {
                $districts = DB::table('indonesia_districts')->where('city_code', $target->city_code)->get();
            }
        } else {
            $districts = DB::table('indonesia_districts')->where('city_code', $admin->city_code)->get();
        }

        return [
            'provinces' => $provinces,
            'cities' => $cities,
            'districts' => $districts,
            'target_province_code' => $targetProvinceCode,
            'admin_region_names' => [
                'province' => $admin->province_code ? DB::table('indonesia_provinces')->where('code', $admin->province_code)->value('name') : null,
                'city' => $admin->city_code ? DB::table('indonesia_cities')->where('code', $admin->city_code)->value('name') : null,
                'district' => $admin->district_code ? DB::table('indonesia_districts')->where('code', $admin->district_code)->value('name') : null,
                'village' => $admin->village_code ? DB::table('indonesia_villages')->where('code', $admin->village_code)->value('name') : null,
            ],
            'admin_level' => [
                'province_code' => $admin->province_code,
                'city_code' => $admin->city_code,
                'district_code' => $admin->district_code,
                'village_code' => $admin->village_code,
            ],
        ];
    }

    public function storeRelawan(User $user)
    {
        // Self-service: hanya user yang bersangkutan yang boleh mendaftarkan dirinya jadi relawan.
        abort_unless($user->id === auth()->id(), 403);

        try {
            $user->assignRole('relawan');
            flashMessage(MessageType::UPDATED->message('Relawan'));
            return redirect()->route('dashboard');
            // return to_route('dashboard');
        } catch (Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');

            return to_route('dashboard');
        }

        

    }

    public function storeDetailUser(UserRequest $request, User $user)
   {
        // Self-service: hanya user yang bersangkutan yang boleh melengkapi profilnya sendiri.
        abort_unless($user->id === auth()->id(), 403);

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
