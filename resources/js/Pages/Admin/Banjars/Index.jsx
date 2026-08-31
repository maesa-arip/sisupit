import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
	IconAlertTriangle,
	IconCheck,
	IconEdit,
	IconHomeCog,
	IconPlus,
	IconSearch,
	IconTrash,
} from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

/** Label status baris. `usulan` = diketik warga, belum ditinjau admin. */
const STATUS_LABELS = { Semua: 'Semua', terverifikasi: 'Terverifikasi', usulan: 'Usulan Warga' };

/** Label jenis banjar. Nilai kosong berarti daftarnya belum dipilah — bukan "tidak punya jenis". */
const JENIS_LABELS = { dinas: 'Banjar Dinas', adat: 'Banjar Adat' };

/**
 * Master banjar — satuan komunitas Bali di bawah desa/kelurahan (permintaan user 2026-08-26).
 * Halaman ini yang mengisi dropdown banjar di form Hydrant Warga dan layar Lengkapi Profil.
 *
 * Untuk daftar sungguhan (Denpasar sendiri ±400 banjar) entri satu per satu di sini bukan
 * jalur yang dimaksud — pakai `php artisan sisupit:import-banjar berkas.csv`. Halaman ini untuk
 * koreksi, penambahan susulan, dan menonaktifkan banjar yang sudah tak dipakai.
 */
export default function Index({
	banjars,
	filters,
	jenis_options = [],
	status_options = [],
	total = 0,
	jumlah_usulan = 0,
	require_banjar = false,
	cakupan = { terisi: 0, total: 0 },
}) {
	const [banjarToDelete, setBanjarToDelete] = useState(null);

	const { data, setData, get } = useForm({
		search: filters?.search || '',
		jenis: filters?.jenis || 'Semua',
		status: filters?.status || 'Semua',
	});

	const handleSearch = (e) => {
		e.preventDefault();
		get(route('admin.banjars.index'), { preserveState: true, preserveScroll: true });
	};

	// Menyetujui usulan warga. Tanpa konfirmasi: ini tindakan yang gampang dibatalkan (ubah
	// statusnya kembali lewat form), tidak seperti hapus.
	const setujui = (id) =>
		router.post(route('admin.banjars.verify', id), {}, { preserveScroll: true, preserveState: true });

	const applyFilter = (kunci, value) => {
		setData(kunci, value);
		router.get(
			route('admin.banjars.index'),
			{ ...data, [kunci]: value },
			{ preserveState: true, preserveScroll: true },
		);
	};

	// Saklar kewajiban berdiri di halaman ini supaya keputusan menyalakannya diambil sambil
	// melihat daftarnya. Server tetap menolak permintaan menyalakan saat master kosong —
	// layar hanya mendahului penolakan itu agar tak terasa seperti tombol rusak.
	const toggleRequirement = () => {
		router.post(
			route('admin.banjars.require'),
			{ require: !require_banjar },
			{
				preserveScroll: true,
				onSuccess: (success) => {
					const flash = flashMessage(success);
					if (flash) toast[flash.type](flash.message);
				},
				onError: (errs) => toast.error(errs.require ?? 'Gagal mengubah pengaturan.'),
			},
		);
	};

	const confirmDelete = () => {
		if (banjarToDelete)
			router.delete(route('admin.banjars.destroy', banjarToDelete), {
				preserveScroll: true,
				onSuccess: () => setBanjarToDelete(null),
			});
	};

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<Head title="Manajemen Banjar" />

			{banjarToDelete && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl">
						<div className="flex items-center gap-3 text-destructive">
							<IconAlertTriangle className="h-6 w-6" />{' '}
							<h3 className="text-lg font-bold">Hapus banjar?</h3>
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							Banjar ini tidak lagi muncul di pilihan warga maupun form hydrant warga. Warga dan tandon
							yang terlanjur menunjuk ke sana TIDAK ikut terhapus - banjarnya saja yang dikosongkan.
						</p>
						<div className="mt-6 flex justify-end gap-3">
							<Button variant="ghost" onClick={() => setBanjarToDelete(null)}>
								Batal
							</Button>
							<Button
								className="bg-destructive text-destructive-foreground shadow-none hover:bg-destructive/90"
								onClick={confirmDelete}
							>
								Hapus
							</Button>
						</div>
					</div>
				</div>
			)}

			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Manajemen Banjar"
					subtitle="Daftar banjar per desa/kelurahan - dipakai form hydrant warga & pendaftaran warga."
					icon={IconHomeCog}
				/>
				<Button size="sm" asChild>
					<Link href={route('admin.banjars.create')}>
						<IconPlus className="mr-1.5 h-4 w-4" /> Tambah Banjar
					</Link>
				</Button>
			</div>

			<Card className={require_banjar ? 'border-primary/30 bg-primary/5 shadow-none' : 'shadow-none'}>
				<CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="min-w-0">
						<h3 className="text-sm font-semibold text-foreground">
							Wajibkan banjar saat warga melengkapi profil
						</h3>
						<p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
							{total === 0
								? 'Belum bisa dinyalakan - master banjar masih kosong, dan dropdown kosong yang diwajibkan akan memblokir pendaftaran warga.'
								: require_banjar
									? 'Warga tidak bisa melanjutkan sebelum memilih banjar. Desa yang masternya masih kosong tidak terkunci - warga di sana bisa menambahkan banjarnya sendiri, lalu masuk ke antrean tinjauan.'
									: 'Saat ini banjar masih opsional. Warga yang banjarnya belum terdaftar bisa menambahkan sendiri, jadi desa yang belum lengkap tidak menghalangi.'}
						</p>
						{/* Kelengkapan ditampilkan supaya keputusan menyalakan saklar diambil sambil
						    melihat angkanya — bukan sebagai syarat. Lihat cakupanDesa() di controller. */}
						{cakupan.total > 0 && (
							<p className="mt-1.5 text-xs font-medium text-muted-foreground">
								{cakupan.terisi} dari {cakupan.total} desa/kelurahan di wilayah Anda sudah punya daftar
								banjar
								{cakupan.terisi < cakupan.total
									? ` · ${cakupan.total - cakupan.terisi} belum`
									: ' · lengkap'}
							</p>
						)}
					</div>
					<Button
						size="sm"
						variant={require_banjar ? 'default' : 'outline'}
						disabled={total === 0 && !require_banjar}
						onClick={toggleRequirement}
						className="shrink-0"
					>
						{require_banjar ? 'Wajib - matikan' : 'Nyalakan kewajiban'}
					</Button>
				</CardContent>
			</Card>

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<form onSubmit={handleSearch} className="relative w-full max-w-md">
					<IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Cari nama atau kode banjar..."
						className="h-10 pl-9"
						value={data.search}
						onChange={(e) => setData('search', e.target.value)}
					/>
				</form>
				{/* Penyaring status — pintu masuk antrean tinjauan. Usulan warga yang tak pernah
				    ditinjau akan menumpuk diam-diam, jadi jumlahnya dicetak di chip-nya. */}
				<div className="flex gap-2">
					{['Semua', ...status_options].map((status) => (
						<button
							key={status}
							type="button"
							onClick={() => applyFilter('status', status)}
							className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
								data.status === status
									? 'border-primary/30 bg-primary/10 text-primary'
									: 'border-input bg-transparent text-muted-foreground hover:bg-accent'
							}`}
						>
							{STATUS_LABELS[status] ?? status}
							{status === 'usulan' && jumlah_usulan > 0 ? ` (${jumlah_usulan})` : ''}
						</button>
					))}
				</div>
				<div className="flex gap-2">
					{['Semua', ...jenis_options].map((jenis) => (
						<button
							key={jenis}
							type="button"
							onClick={() => applyFilter('jenis', jenis)}
							className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
								data.jenis === jenis
									? 'border-primary/30 bg-primary/10 text-primary'
									: 'border-input bg-transparent text-muted-foreground hover:bg-accent'
							}`}
						>
							{JENIS_LABELS[jenis] ?? jenis}
						</button>
					))}
				</div>
			</div>

			<div className="flex flex-col gap-3">
				{banjars.data && banjars.data.length > 0 ? (
					<>
						{banjars.data.map((banjar) => (
							<Card key={banjar.id} className="transition-colors hover:border-primary/40">
								<CardContent className="flex flex-row items-start gap-3 p-3 sm:p-4">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
										<IconHomeCog className="h-5 w-5" />
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<h3 className="truncate text-sm font-semibold text-foreground">
												{banjar.name}
											</h3>
											{banjar.jenis && (
												<span className="shrink-0 rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
													{JENIS_LABELS[banjar.jenis] ?? banjar.jenis}
												</span>
											)}
											{banjar.status === 'usulan' && (
												<span className="shrink-0 rounded-md border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase text-warning">
													Usulan Warga
												</span>
											)}
											{!banjar.is_active && (
												<span className="shrink-0 rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
													Nonaktif
												</span>
											)}
										</div>
										<p className="mt-0.5 truncate text-xs text-muted-foreground">
											{/* Kode desa TIDAK pernah dicetak sebagai judul (aturan #78): kalau
											    namanya tak dikenal, katakan begitu apa adanya. */}
											{banjar.village ?? 'Desa tidak dikenal'}
											{banjar.code ? ` · ${banjar.code}` : ''}
										</p>
									</div>
									<div className="flex shrink-0 gap-1">
										{/* Menyetujui = membalik kolom status; id barisnya TIDAK berubah sehingga
										    users.banjar_id & hydrant_wargas.banjar_id yang menunjuk ke sini tetap utuh. */}
										{banjar.status === 'usulan' && (
											<Button
												variant="ghost"
												size="icon"
												onClick={() => setujui(banjar.id)}
												title="Tandai terverifikasi"
												className="h-8 w-8 text-muted-foreground hover:text-success"
											>
												<IconCheck className="h-4 w-4" />
											</Button>
										)}
										<Button
											variant="ghost"
											size="icon"
											asChild
											className="h-8 w-8 text-muted-foreground hover:text-info"
										>
											<Link href={route('admin.banjars.edit', banjar.id)}>
												<IconEdit className="h-4 w-4" />
											</Link>
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => setBanjarToDelete(banjar.id)}
											className="h-8 w-8 text-muted-foreground hover:text-destructive"
										>
											<IconTrash className="h-4 w-4" />
										</Button>
									</div>
								</CardContent>
							</Card>
						))}

						<div className="mt-2 flex flex-col items-center gap-3 border-t border-dashed border-border pt-4">
							<span className="text-[11px] font-medium text-muted-foreground">
								Menampilkan {banjars.from} - {banjars.to} dari {banjars.total} banjar
							</span>

							{banjars.links && banjars.links.length > 3 && (
								<div className="flex flex-wrap justify-center gap-1">
									{banjars.links.map((link, index) =>
										link.url ? (
											<Link
												key={index}
												href={link.url}
												preserveScroll
												className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
													link.active
														? 'border-primary bg-primary text-primary-foreground shadow-sm'
														: 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
												}`}
												dangerouslySetInnerHTML={{ __html: link.label }}
											/>
										) : (
											<span
												key={index}
												className="cursor-not-allowed rounded-md border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground opacity-50"
												dangerouslySetInnerHTML={{ __html: link.label }}
											/>
										),
									)}
								</div>
							)}
						</div>
					</>
				) : (
					<div className="rounded-xl border border-dashed border-input p-8 text-center">
						<p className="text-sm font-medium text-foreground">
							{total > 0
								? 'Tidak ada banjar yang cocok dengan pencarian.'
								: 'Master banjar masih kosong.'}
						</p>
						{total === 0 && (
							<p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-muted-foreground">
								Daftar banjar tidak tersedia sebagai unduhan resmi - mintakan ke BPS Kota (banjar = SLS,
								punya kode) atau Bagian Pemerintahan/Dinas PMD, lalu muat sekaligus dengan{' '}
								<code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
									php artisan sisupit:import-banjar berkas.csv
								</code>
								. Selama master masih kosong, jangan menyalakan kewajiban banjar di Pengaturan -
								dropdown yang kosong akan memblokir pendaftaran warga.
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
Index.layout = (page) => <AppLayout children={page} title="Manajemen Banjar" />;
