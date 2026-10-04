import { AppEmpty } from '@/Components/AppSection';
import ComboBox from '@/Components/ComboBox';
import { filledFieldsClass } from '@/Components/GroupedForm';
import HeaderTitle from '@/Components/HeaderTitle';
import PaginationLinks from '@/Components/PaginationLinks';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import {
	IconAdjustmentsHorizontal,
	IconChevronDown,
	IconChevronRight,
	IconFilterX,
	IconMapPinFilled,
	IconSearch,
	IconUsersGroup,
} from '@tabler/icons-react';
import { useState } from 'react';

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
	// Lima pilihan filter dulu selalu terbuka (5 dropdown bertumpuk di atas daftar, TASK_69 bagian 16).
	// Kini terlipat di balik tombol "Filter" - terbuka sendiri bila memang ada filter yang aktif.
	const activeFilterCount = ['kabupaten', 'kecamatan', 'desa', 'keahlian', 'status'].filter((k) => data[k]).length;
	const [showFilters, setShowFilters] = useState(activeFilterCount > 0);

	const options = filterOptions || { kabupaten: [], kecamatan: [], desa: [], keahlian: [] };

	const FILTERS = [
		{ key: 'kabupaten', label: 'Kabupaten / Kota', items: options.kabupaten, placeholder: 'Semua kabupaten/kota' },
		{ key: 'kecamatan', label: 'Kecamatan', items: options.kecamatan, placeholder: 'Semua kecamatan' },
		{ key: 'desa', label: 'Desa / Kelurahan', items: options.desa, placeholder: 'Semua desa/kelurahan' },
		{ key: 'keahlian', label: 'Keahlian', items: options.keahlian, placeholder: 'Semua keahlian' },
		{ key: 'status', label: 'Status Siaga', items: STATUS_OPTIONS, placeholder: 'Semua status' },
	];

	return (
		<div className="relative flex w-full flex-col space-y-5 pb-32">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Daftar Relawan"
					subtitle="Temukan pahlawan di sekitar Anda atau cari berdasarkan wilayah."
					icon={IconUsersGroup}
				/>
			</div>

			{/* --- PENCARIAN & FILTER --- */}
			<form onSubmit={handleSubmit} className="space-y-3">
				<div className="flex gap-2">
					<div className="relative flex-1">
						<IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							enterKeyHint="search"
							placeholder="Cari nama relawan..."
							className="h-11 w-full rounded-xl border-transparent bg-muted/60 pl-9"
							value={data.search}
							onChange={(e) => setData('search', e.target.value)}
						/>
					</div>
					<button
						type="button"
						onClick={() => setShowFilters((v) => !v)}
						aria-expanded={showFilters}
						className={cn(
							'flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[15px] font-medium transition-[background-color,transform] active:scale-[0.97]',
							activeFilterCount > 0 ? 'bg-primary/10 text-primary' : 'bg-muted/60 text-foreground',
						)}
					>
						<IconAdjustmentsHorizontal className="h-4 w-4" />
						Filter
						{activeFilterCount > 0 && (
							<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
								{activeFilterCount}
							</span>
						)}
						<IconChevronDown
							className={cn('h-4 w-4 transition-transform duration-200', showFilters && 'rotate-180')}
						/>
					</button>
				</div>

				{showFilters && (
					<div className="space-y-3">
						<div
							className={cn(
								'divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm sm:grid sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3 xl:grid-cols-5',
								filledFieldsClass,
							)}
						>
							{FILTERS.map((f) => (
								<div key={f.key} className="grid gap-1.5 px-4 py-3">
									<Label className="text-[13px] font-medium text-muted-foreground">{f.label}</Label>
									<ComboBox
										items={f.items}
										selectedItem={data[f.key]}
										onSelect={(value) => setData(f.key, value)}
										placeholder={f.placeholder}
									/>
								</div>
							))}
						</div>
						<div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
							{hasActiveFilters && (
								<Button
									type="button"
									variant="ghost"
									onClick={handleReset}
									disabled={processing}
									className="h-11 rounded-xl text-muted-foreground hover:text-foreground"
								>
									<IconFilterX className="mr-1.5 h-4 w-4" /> Reset Filter
								</Button>
							)}
							<Button type="submit" disabled={processing} className="h-11 rounded-xl px-6 text-[15px]">
								Terapkan Filter
							</Button>
						</div>
					</div>
				)}
			</form>

			{/* --- INFO JUMLAH HASIL --- */}
			<p className="px-1 text-[13px] text-muted-foreground">
				Menampilkan <span className="font-semibold text-foreground">{volunteers.data.length}</span> dari{' '}
				<span className="font-semibold text-foreground">{volunteers.total ?? volunteers.data.length}</span>{' '}
				relawan
			</p>

			{/* --- DAFTAR RELAWAN: satu daftar bergrup, tiap baris membuka profil --- */}
			{volunteers.data.length > 0 ? (
				<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
					{volunteers.data.map((volunteer) => (
						<div
							key={volunteer.id}
							className="relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 active:bg-muted"
						>
							<div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground">
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

							<div className="min-w-0 flex-1">
								<div className="flex items-start justify-between gap-2">
									<h3 className="min-w-0 break-words text-[15px] font-semibold leading-snug text-foreground">
										<Link
											href={route('front.volunteers.show', volunteer.id)}
											className="after:absolute after:inset-0"
										>
											{volunteer.name}
										</Link>
									</h3>
									<span
										className={cn(
											'shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold',
											volunteer.status === 'Siaga'
												? 'bg-success/10 text-success'
												: 'bg-muted text-muted-foreground',
										)}
									>
										{volunteer.status}
									</span>
								</div>
								<p className="mt-0.5 flex items-start gap-1 text-[13px] leading-snug text-muted-foreground">
									<IconMapPinFilled className="mt-0.5 h-3.5 w-3.5 shrink-0" />
									{volunteer.area}
								</p>
								{volunteer.skills && volunteer.skills.length > 0 && (
									<p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
										{volunteer.skills.join(' · ')}
									</p>
								)}
							</div>
							<IconChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
						</div>
					))}
				</div>
			) : (
				<div className="rounded-2xl border border-border/70 bg-card shadow-sm">
					<AppEmpty
						icon={IconUsersGroup}
						title="Belum ada relawan ditemukan"
						description="Coba ubah filter pencarian Anda atau perluas jangkauan wilayah."
					/>
				</div>
			)}

			{/* --- PAGINASI --- */}
			<PaginationLinks links={volunteers.links} />
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title="Daftar Relawan" />;
