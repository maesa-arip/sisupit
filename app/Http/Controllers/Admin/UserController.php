<?php

namespace App\Http\Controllers\Admin;

use App\Enums\MessageType;
use App\Enums\TenantLevel;
use App\Enums\UserGender;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserRequest;
use App\Http\Resources\Admin\UserResource;
use App\Models\User;
use App\Traits\HasFile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    use HasFile;

    /**
     * Peran yang yurisdiksinya ditentukan oleh kode wilayah (lihat scopeIsAdmin/UserPolicy).
     * Saat salah satunya ditetapkan, admin juga memilih tingkat wilayah & kode dipangkas
     * ke tingkat itu — peran lain (masyarakat/relawan) memakai alamat lengkap apa adanya.
     */
    private const JURISDICTIONAL_ROLES = ['admin', 'petugas', 'pejabat'];

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
            'roles' => $this->roleOptions(array_values(array_diff($this->allRoleNames(), ['superadmin']))),
            'assignable_roles' => $this->assignableRoleNames(),
            'assignable_levels' => $this->assignableLevels(),
            'jurisdictional_roles' => self::JURISDICTIONAL_ROLES,
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

    public function assignRole(Request $request, User $user): RedirectResponse
    {
        // Penetapan peran memakai guard yurisdiksi yang sama dengan edit/hapus (UserPolicy),
        // sehingga admin hanya bisa mengubah peran pengguna di wilayahnya sendiri.
        $this->authorize('update', $user);

        // Rule::in memakai daftar peran yang boleh diberikan admin ini — server menolak
        // upaya menetapkan peran di atas kewenangannya (mis. admin mengangkat superadmin/admin).
        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in($this->assignableRoleNames())],
        ]);

        $role = $validated['role'];
        $regionCodes = null;

        if (in_array($role, self::JURISDICTIONAL_ROLES, true)) {
            // Tingkat dibatasi: admin tak boleh memberi yurisdiksi lebih luas dari dirinya
            // (assignableLevels) DAN pengguna harus punya kode wilayah sampai tingkat itu.
            $request->validate([
                'level' => ['required', Rule::in(array_column($this->assignableLevels(), 'value'))],
            ]);

            $level = TenantLevel::from($request->level);

            if ($this->regionRank($user) < $level->rank()) {
                throw ValidationException::withMessages([
                    'level' => "Pengguna belum memiliki data wilayah sampai tingkat {$level->label()}. Lengkapi wilayah pengguna lebih dulu.",
                ]);
            }

            $regionCodes = $this->trimRegionToLevel($user, $level);
        }

        try {
            DB::transaction(function () use ($user, $role, $regionCodes) {
                $user->syncRoles([$role]);
                if ($regionCodes !== null) {
                    $user->update($regionCodes);
                }
            });
            flashMessage("Berhasil menetapkan peran {$role} ke pengguna {$user->name}");

            return to_route('admin.users.index');
        } catch (\Throwable $e) {
            flashMessage(MessageType::ERROR->message(error: $e->getMessage()), 'error');

            return to_route('admin.users.index');
        }
    }

    /**
     * Tingkat wilayah {value,label,rank} yang boleh diberikan admin yang sedang login.
     * Tidak boleh memberi tingkat yang lebih luas dari yurisdiksi admin itu sendiri
     * (rank lebih besar = lebih spesifik; superadmin/admin nasional bebas semua tingkat).
     */
    private function assignableLevels(): array
    {
        $minRank = max($this->regionRank(auth()->user()), TenantLevel::PROVINSI->rank());

        return collect(TenantLevel::cases())
            ->filter(fn (TenantLevel $level) => $level->rank() >= $minRank)
            ->map(fn (TenantLevel $level) => [
                'value' => $level->value,
                'label' => $level->label(),
                'rank' => $level->rank(),
            ])
            ->values()
            ->all();
    }

    /**
     * Rank wilayah terdalam yang dimiliki user (desa=4 … provinsi=1, 0 jika tanpa wilayah).
     */
    private function regionRank(User $user): int
    {
        return match (true) {
            (bool) $user->village_code => TenantLevel::DESA->rank(),
            (bool) $user->district_code => TenantLevel::KECAMATAN->rank(),
            (bool) $user->city_code => TenantLevel::KABUPATEN->rank(),
            (bool) $user->province_code => TenantLevel::PROVINSI->rank(),
            default => 0,
        };
    }

    /**
     * Kosongkan kode wilayah yang lebih dalam dari tingkat yang dipilih, sehingga
     * yurisdiksi (scopeIsAdmin/Tenantable) berhenti tepat di tingkat itu.
     */
    private function trimRegionToLevel(User $user, TenantLevel $level): array
    {
        $codes = [
            'province_code' => $user->province_code,
            'city_code' => $user->city_code,
            'district_code' => $user->district_code,
            'village_code' => $user->village_code,
        ];

        return match ($level) {
            TenantLevel::PROVINSI => array_merge($codes, ['city_code' => null, 'district_code' => null, 'village_code' => null]),
            TenantLevel::KABUPATEN => array_merge($codes, ['district_code' => null, 'village_code' => null]),
            TenantLevel::KECAMATAN => array_merge($codes, ['village_code' => null]),
            TenantLevel::DESA => $codes,
        };
    }

    /**
     * Semua peran (guard web) sebagai {value,label} untuk ditampilkan di dialog —
     * peran yang tidak boleh diberikan admin ini tetap tampil (mis. peran user saat ini)
     * tapi dinonaktifkan di frontend berdasarkan prop `assignable_roles`.
     */
    private function roleOptions(array $names): array
    {
        $labels = [
            'masyarakat' => 'Masyarakat',
            'relawan' => 'Relawan',
            'petugas' => 'Petugas',
            'pejabat' => 'Pejabat',
            'admin' => 'Admin',
            'superadmin' => 'Superadmin',
        ];

        return collect($names)
            ->map(fn ($name) => [
                'value' => $name,
                'label' => $labels[$name] ?? ucfirst($name),
            ])
            ->values()
            ->all();
    }

    private function allRoleNames(): array
    {
        return Role::query()
            ->where('guard_name', 'web')
            ->orderBy('id')
            ->pluck('name')
            ->all();
    }

    /**
     * Superadmin tidak pernah bisa diberikan lewat panel (peran developer pusat). Hanya
     * superadmin yang boleh mengangkat admin; admin wilayah dibatasi sampai petugas untuk
     * mencegah eskalasi hak akses (keputusan 2026-06-27).
     */
    private function assignableRoleNames(): array
    {
        if (auth()->user()->hasRole('superadmin')) {
            return array_values(array_diff($this->allRoleNames(), ['superadmin']));
        }

        return ['masyarakat', 'relawan', 'petugas', 'pejabat'];
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
