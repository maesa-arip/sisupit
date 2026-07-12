import ComboBox from '@/Components/ComboBox';
import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AppLayout from '@/Layouts/AppLayout';
import { Link, router, useForm } from '@inertiajs/react';
import { IconFilterX, IconMapPinFilled, IconMedal, IconPhone, IconSearch, IconUsersGroup } from '@tabler/icons-react';

export default function Index({ volunteers, filterOptions, filters, ...props }) {
	const { data, setData, get, processing } = useForm({
		search: filters?.search || '',
		kabupaten: filters?.kabupaten || '',
		kecamatan: filters?.kecamatan || '',
		desa: filters?.desa || '',
		keahlian: filters?.keahlian || '',
		status: filters?.status || '',
	});

	const STATUS_OPTIONS = [
		{ value: 'siaga', label: 'Siaga' },
		{ value: 'nonaktif', label: 'Nonaktif' },
	];

	const handleSubmit = (e) => {
		e.preventDefault();
		// useForm().get mengirim `data` (search + kode wilayah + keahlian) sebagai query string.
		get(route('front.volunteers.index'), { preserveState: true, preserveScroll: true });
	};

	// ComboBox tidak bisa di-deselect, jadi reset = muat ulang tanpa query.
	const handleReset = () => {
		router.get(route('front.volunteers.index'), {}, { preserveScroll: true });
	};

	const hasActiveFilters = Object.values(data).some((v) => v);

	const options = filterOptions || { kabupaten: [], kecamatan: [], desa: [], keahlian: [] };

	return (
		<div className="relative flex w-full flex-col space-y-6 pb-32">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Daftar Relawan"
					subtitle="Temukan pahlawan di sekitar Anda atau cari berdasarkan wilayah."
					icon={IconUsersGroup}
				/>
			</div>

			{/* --- PANEL PENCARIAN & FILTER --- */}
			<Card className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
				<CardContent className="p-5">
					<form onSubmit={handleSubmit} className="flex flex-col gap-5">
						{/* Search Nama */}
						<div className="relative flex-1">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								<IconSearch className="h-4 w-4 text-muted-foreground" />
							</div>
							<Input
								type="text"
								placeholder="Cari nama relawan..."
								className="h-10 w-full rounded-md border-border bg-muted pl-9 text-sm focus-visible:ring-1 focus-visible:ring-destructive"
								value={data.search}
								onChange={(e) => setData('search', e.target.value)}
							/>
						</div>

						<hr className="border-border" />

						{/* Filter Wilayah, Keahlian & Status (Menggunakan ComboBox) */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
							<div className="space-y-1.5">
								<Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
									Kabupaten / Kota
								</Label>
								<ComboBox
									items={options.kabupaten}
									selectedItem={data.kabupaten}
									onSelect={(value) => setData('kabupaten', value)}
									placeholder="Semua kabupaten/kota"
								/>
							</div>

							<div className="space-y-1.5">
								<Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
									Kecamatan
								</Label>
								<ComboBox
									items={options.kecamatan}
									selectedItem={data.kecamatan}
									onSelect={(value) => setData('kecamatan', value)}
									placeholder="Semua kecamatan"
								/>
							</div>

							<div className="space-y-1.5">
								<Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
									Desa / Kelurahan
								</Label>
								<ComboBox
									items={options.desa}
									selectedItem={data.desa}
									onSelect={(value) => setData('desa', value)}
									placeholder="Semua desa/kelurahan"
								/>
							</div>

							<div className="space-y-1.5">
								<Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
									Keahlian
								</Label>
								<ComboBox
									items={options.keahlian}
									selectedItem={data.keahlian}
									onSelect={(value) => setData('keahlian', value)}
									placeholder="Semua keahlian"
								/>
							</div>

							<div className="space-y-1.5">
								<Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
									Status Siaga
								</Label>
								<ComboBox
									items={STATUS_OPTIONS}
									selectedItem={data.status}
									onSelect={(value) => setData('status', value)}
									placeholder="Semua status"
								/>
							</div>
						</div>

						{/* Baris Aksi Filter */}
						<div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
							{hasActiveFilters && (
								<Button
									type="button"
									variant="ghost"
									onClick={handleReset}
									disabled={processing}
									className="h-10 rounded-md text-muted-foreground hover:text-foreground sm:w-auto"
								>
									<IconFilterX className="mr-1.5 h-4 w-4" /> Reset Filter
								</Button>
							)}
							<Button
								type="submit"
								disabled={processing}
								className="h-10 rounded-md bg-destructive px-6 font-medium text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50"
							>
								Terapkan Filter
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* --- INFO JUMLAH HASIL --- */}
			<p className="text-sm text-muted-foreground">
				Menampilkan <span className="font-semibold text-foreground">{volunteers.data.length}</span> dari{' '}
				<span className="font-semibold text-foreground">{volunteers.total ?? volunteers.data.length}</span>{' '}
				relawan
			</p>

			{/* --- DAFTAR GRID RELAWAN --- */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{volunteers.data.length > 0 ? (
					volunteers.data.map((volunteer) => (
						<Card
							key={volunteer.id}
							className="group flex h-full flex-col overflow-hidden rounded-xl border-border bg-card shadow-sm transition-all duration-200 hover:border-muted-foreground/30 hover:shadow-md"
						>
							<CardContent className="flex flex-1 flex-col p-5">
								<div className="mb-4 flex items-start justify-between">
									{/* Avatar */}
									<div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted text-lg font-bold text-muted-foreground shadow-sm">
										{volunteer.avatar ? (
											<img
												src={volunteer.avatar}
												alt={volunteer.name}
												className="h-full w-full object-cover"
											/>
										) : (
											<IconUsersGroup className="h-5 w-5" stroke={1.5} />
										)}
									</div>

									{/* Status Badge */}
									<span
										className={`whitespace-nowrap rounded border px-2 py-0.5 text-xs font-semibold ${
											volunteer.status === 'Siaga'
												? 'border-success/30 bg-success/10 text-success'
												: 'border-border bg-muted text-muted-foreground'
										}`}
									>
										{volunteer.status}
									</span>
								</div>

								{/* Info Relawan */}
								<div className="flex-1">
									<h3 className="line-clamp-1 text-base font-semibold text-foreground transition-colors group-hover:text-destructive">
										{volunteer.name}
									</h3>
									<p className="mt-1 line-clamp-2 flex items-start gap-1.5 text-[13px] leading-snug text-muted-foreground">
										<IconMapPinFilled className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
										{volunteer.area}
									</p>
								</div>

								{/* Keahlian / Badge Skills */}
								<div className="mb-5 mt-4 flex flex-wrap gap-1.5">
									{volunteer.skills && volunteer.skills.length > 0 ? (
										volunteer.skills.map((skill, index) => (
											<span
												key={index}
												className="flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-medium text-foreground/80"
											>
												<IconMedal className="h-3 w-3 text-destructive" stroke={1.5} />
												{skill}
											</span>
										))
									) : (
										<span className="text-[11px] italic text-muted-foreground">
											Belum ada keahlian terdaftar.
										</span>
									)}
								</div>

								<Button
									variant="outline"
									className="h-9 w-full rounded-md border-border bg-card text-foreground/80 transition-colors hover:bg-muted"
									asChild
								>
									<Link
										href={route('front.volunteers.show', volunteer.id)}
										className="flex items-center justify-center gap-2"
									>
										<IconPhone className="h-4 w-4" /> Lihat Profil
									</Link>
								</Button>
							</CardContent>
						</Card>
					))
				) : (
					/* State Jika Data Kosong */
					<div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 p-10 text-center">
						<IconUsersGroup className="mb-2 h-10 w-10 text-muted-foreground" stroke={1.5} />
						<h4 className="text-sm font-semibold text-foreground">Belum ada relawan ditemukan</h4>
						<p className="mt-1 text-xs text-muted-foreground">
							Coba ubah filter pencarian Anda atau perluas jangkauan wilayah.
						</p>
					</div>
				)}
			</div>

			{/* --- PAGINASI --- */}
			{volunteers.links && volunteers.links.length > 3 && (
				<div className="scrollbar-hide flex justify-center overflow-x-auto pt-4">
					<div className="flex gap-1">
						{volunteers.links.map((link, index) => (
							<Link
								key={index}
								href={link.url || ''}
								preserveScroll
								className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
									link.active
										? 'bg-foreground text-background'
										: 'border border-border bg-card text-foreground/80 hover:bg-muted'
								} ${!link.url && 'pointer-events-none cursor-not-allowed opacity-50'}`}
								dangerouslySetInnerHTML={{ __html: link.label }}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title="Daftar Relawan" />;
