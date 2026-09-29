<?php

namespace App\Http\Controllers;

use App\Models\Regu;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Regu & Danru (TASK_60). Satu halaman untuk dua peran, gerbangnya berlapis:
 *
 * - route `role:petugas|admin|superadmin` = gerbang pertama saja;
 * - MEMBUAT, MENGGANTI NAMA/DANRU, dan MENGHAPUS regu = admin/superadmin;
 * - MENGATUR ANGGOTA = admin, ATAU danru dari regu itu sendiri (permintaan user: "danru yang
 *   bisa setting siapa saja masuk regu").
 *
 * Hak layarnya dikirim sebagai prop (`can`, `can_manage_members` per regu) dan dihitung di sini,
 * bukan dari daftar peran di JSX (#101) - tombol yang tampil tanpa gerbang yang mengizinkannya
 * hanya melahirkan 403.
 *
 * Anggota regu = PETUGAS SAJA (keputusan user) dan satu petugas hanya di satu regu (UNIQUE di
 * regu_members). Regu yang dicari lewat route binding tetap disaring Tenantable, jadi regu
 * kabupaten lain menjawab 404.
 */
class ReguController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $isAdmin = $user->hasAnyRole(['admin', 'superadmin']);

        if ($isAdmin) {
            $regus = Regu::with(['leader:id,name', 'members:id,name'])->orderBy('name')->get();
            // Kontak & wilayah ikut dimuat supaya admin bisa membedakan petugas yang bernama mirip
            // saat memilih danru/anggota.
            $candidates = User::role('petugas')->isAdmin()
                ->with(['district:code,name', 'village:code,name'])
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'phone', 'city_code', 'district_code', 'village_code']);
        } else {
            $own = Regu::milik($user)?->load(['leader:id,name', 'members:id,name']);
            $regus = collect($own ? [$own] : []);
            // Danru memilih anggota dari petugas SEKABUPATEN regunya - batas yang sama dengan
            // yang diperiksa syncMembers(), supaya daftar pilihan tak menawarkan nama yang ditolak.
            $candidates = $own && $own->isLeader($user)
                ? User::role('petugas')->where('city_code', $own->city_code)->orderBy('name')->get(['id', 'name', 'city_code'])
                : collect();
        }

        // Regu tempat tiap calon sudah bernaung - ditampilkan di pilihan supaya danru tahu kenapa
        // seseorang tak bisa ditarik (satu petugas hanya di satu regu).
        $reguOf = DB::table('regu_members')
            ->join('regus', 'regus.id', '=', 'regu_members.regu_id')
            ->whereNull('regus.deleted_at')
            ->whereIn('regu_members.user_id', $candidates->pluck('id'))
            ->get(['regu_members.user_id', 'regus.id as regu_id', 'regus.name as regu_name'])
            ->keyBy('user_id');

        return Inertia::render('Regu/Index', [
            'regus' => $regus->map(fn (Regu $regu) => [
                'id' => $regu->id,
                'name' => $regu->name,
                'leader' => $regu->leader ? ['id' => $regu->leader->id, 'name' => $regu->leader->name] : null,
                'members' => $regu->members->sortBy('name')->map(fn ($m) => ['id' => $m->id, 'name' => $m->name])->values(),
                'can_manage_members' => $isAdmin || $regu->isLeader($user),
            ])->values(),
            'candidates' => $candidates->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'regu_id' => optional($reguOf->get($c->id))->regu_id,
                'regu_name' => optional($reguOf->get($c->id))->regu_name,
                // Rincian pembeda HANYA untuk admin: prop yang sama dikirim ke danru (petugas), dan
                // danru tak perlu kontak pribadi rekan sekabupatennya untuk memilih anggota.
                ...($isAdmin ? [
                    'email' => $c->email,
                    'phone' => $c->phone,
                    'wilayah' => collect([
                        $c->village?->name ? 'Desa/Kel. '.$c->village->name : null,
                        $c->district?->name ? 'Kec. '.$c->district->name : null,
                    ])->filter()->implode(', ') ?: null,
                ] : []),
            ])->values(),
            'can' => [
                'manage' => $isAdmin,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->ensureAdmin();

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'leader_id' => 'required|integer',
        ]);

        $leader = $this->resolveLeader((int) $validated['leader_id']);
        $this->ensureFree([$leader->id], null, 'leader_id');

        DB::transaction(function () use ($validated, $leader) {
            // Wilayah regu = KABUPATEN danru; district/village sengaja NULL (lihat model Regu).
            $regu = Regu::create([
                'name' => $validated['name'],
                'leader_id' => $leader->id,
                'province_code' => $leader->province_code,
                'city_code' => $leader->city_code,
            ]);
            $regu->members()->attach($leader->id);
        });

        flashMessage('Regu berhasil dibuat.');

        return back();
    }

    public function update(Request $request, Regu $regu)
    {
        $this->ensureAdmin();

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'leader_id' => 'required|integer',
        ]);

        $leader = $this->resolveLeader((int) $validated['leader_id'], $regu);
        $this->ensureFree([$leader->id], $regu, 'leader_id');

        DB::transaction(function () use ($regu, $validated, $leader) {
            $regu->update(['name' => $validated['name'], 'leader_id' => $leader->id]);
            // Danru selalu juga anggota regunya.
            $regu->members()->syncWithoutDetaching([$leader->id]);
        });

        flashMessage('Regu berhasil diperbarui.');

        return back();
    }

    public function destroy(Regu $regu)
    {
        $this->ensureAdmin();

        // Anggota dilepas supaya bebas masuk regu lain. Riwayat insiden tak ikut hilang: nama regu
        // sudah di-snapshot di report_officers.regu_name & report_jaga_kantor.regu_name.
        DB::transaction(function () use ($regu) {
            $regu->members()->detach();
            $regu->delete();
        });

        flashMessage('Regu berhasil dihapus.');

        return back();
    }

    public function syncMembers(Request $request, Regu $regu)
    {
        $user = auth()->user();
        if (! $user->hasAnyRole(['admin', 'superadmin']) && ! $regu->isLeader($user)) {
            abort(403, 'Hanya danru regu ini atau admin yang bisa mengatur anggotanya.');
        }

        $validated = $request->validate([
            'member_ids' => 'present|array',
            'member_ids.*' => 'integer',
        ]);

        // Danru tak bisa mengeluarkan dirinya sendiri - regu tanpa pemimpin bukan regu.
        $ids = collect($validated['member_ids'])->map(fn ($id) => (int) $id)
            ->push((int) $regu->leader_id)->filter()->unique()->values();

        $valid = User::role('petugas')->whereIn('id', $ids)->where('city_code', $regu->city_code)->pluck('id');
        if ($valid->count() !== $ids->count()) {
            throw ValidationException::withMessages([
                'member_ids' => 'Anggota regu hanya boleh petugas di kabupaten yang sama.',
            ]);
        }

        $this->ensureFree($ids->all(), $regu);

        $regu->members()->sync($ids->all());

        flashMessage('Anggota regu berhasil disimpan.');

        return back();
    }

    private function ensureAdmin(): void
    {
        abort_unless(auth()->user()->hasAnyRole(['admin', 'superadmin']), 403, 'Akses Ditolak.');
    }

    /**
     * Danru = petugas di dalam yurisdiksi admin yang memilihnya (scopeIsAdmin, sama dengan daftar
     * pilihan di index) dan berkode kabupaten - dari kode itulah wilayah regu disalin. Saat
     * mengganti danru regu yang sudah ada, kabupatennya wajib sama dengan regu itu.
     */
    private function resolveLeader(int $id, ?Regu $regu = null): User
    {
        $leader = User::role('petugas')->isAdmin()->find($id);

        if (! $leader || ! $leader->city_code || ($regu && $leader->city_code !== $regu->city_code)) {
            throw ValidationException::withMessages([
                'leader_id' => 'Danru harus petugas berwilayah kabupaten yang sama, di dalam wilayah Anda.',
            ]);
        }

        return $leader;
    }

    /**
     * Satu petugas hanya di satu regu. Ditolak dengan nama orang & regunya, bukan dipindahkan
     * diam-diam - danru yang "menarik" anggota regu lain akan melucuti regu itu tanpa tahu.
     */
    private function ensureFree(array $userIds, ?Regu $except = null, string $field = 'member_ids'): void
    {
        $taken = DB::table('regu_members')
            ->join('regus', 'regus.id', '=', 'regu_members.regu_id')
            ->join('users', 'users.id', '=', 'regu_members.user_id')
            ->whereNull('regus.deleted_at')
            ->whereIn('regu_members.user_id', $userIds)
            ->when($except, fn ($q) => $q->where('regu_members.regu_id', '!=', $except->id))
            ->get(['users.name', 'regus.name as regu_name']);

        if ($taken->isNotEmpty()) {
            throw ValidationException::withMessages([
                $field => 'Sudah tergabung di regu lain: '
                    .$taken->map(fn ($t) => "{$t->name} ({$t->regu_name})")->join(', ').'.',
            ]);
        }
    }
}
