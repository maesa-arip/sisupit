import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import PaginationLinks from '@/Components/PaginationLinks';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/Components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Button } from '@/Components/ui/button';
import { Combobox } from '@/Components/ui/combobox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/Components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import {
	stickyActionsClass,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/Components/ui/table';
import UseFilter from '@/hooks/UseFilter';
import AppLayout from '@/Layouts/AppLayout';
import { cn, flashMessage, roleLabel, roleTone } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import {
	IconArrowsSort,
	IconChevronDown,
	IconChevronUp,
	IconInfoCircle,
	IconPencil,
	IconPlus,
	IconRefresh,
	IconSearch,
	IconTrash,
	IconUsersGroup,
	IconUserShield,
} from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { defaultLevelFor as defaultLevelForRank, levelOptionsFor as levelOptionsForRank } from './roleLevel';

// Rupa halaman ini mengikuti apple-design (TASK_69 bagian 2, PENGECUALIAN_ATURAN #5, khusus branch
// feat/mobile-native-polish): peran tampil dengan LABEL & warnanya sendiri (bukan nama mentah),
// aksi baris = tombol ikon netral (hanya Hapus yang merah), dan arah urut terlihat di kepala kolom.

function RoleBadges({ roles }) {
	if (!roles || roles.length === 0) {
		return <span className="text-xs text-muted-foreground">Tanpa peran</span>;
	}

	return (
		<div className="flex flex-wrap gap-1">
			{roles.map((role) => (
				<span
					key={role}
					className={cn(
						'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
						roleTone([role]),
					)}
				>
					{roleLabel([role])}
				</span>
			))}
		</div>
	);
}

function DeleteUserDialog({ user, children }) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				{children ?? (
					<Button
						variant="ghost"
						size="icon"
						className="size-9 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
						aria-label={`Hapus ${user.name}`}
						title="Hapus"
					>
						<IconTrash className="size-4" />
					</Button>
				)}
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Hapus pengguna ini?</AlertDialogTitle>
					<AlertDialogDescription>
						Akun <span className="font-medium text-foreground">{user.name}</span> akan dihapus permanen dari
						server. Tindakan ini tidak dapat dibatalkan.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
					<AlertDialogAction
						className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
						onClick={() =>
							router.delete(route('admin.users.destroy', [user]), {
								preserveScroll: true,
								preserveState: true,
								onSuccess: (success) => {
									const flash = flashMessage(success);
									if (flash) toast[flash.type](flash.message);
								},
							})
						}
					>
						Hapus
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function UserActions({ user, onAssignRole }) {
	return (
		<div className="flex items-center justify-end gap-0.5">
			<Button
				variant="ghost"
				size="icon"
				className="size-9 rounded-full text-muted-foreground hover:text-foreground"
				aria-label={`Tetapkan peran ${user.name}`}
				title="Tetapkan peran"
				onClick={() => onAssignRole(user)}
			>
				<IconUserShield className="size-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="size-9 rounded-full text-muted-foreground hover:text-foreground"
				aria-label={`Ubah ${user.name}`}
				title="Ubah"
				asChild
			>
				<Link href={route('admin.users.edit', [user])}>
					<IconPencil className="size-4" />
				</Link>
			</Button>
			<DeleteUserDialog user={user} />
		</div>
	);
}

export default function Index(props) {
	const { data: users, meta } = props.users;
	const [params, setParams] = useState(props.state);

	const [roleUser, setRoleUser] = useState(null);
	const { data, setData, put, processing, errors, reset } = useForm({ role: '', level: '', agency_id: '' });

	// Peran `opd` (TASK_27) menuntut satu instansi — dari situlah ditentukan permintaan bantuan
	// mana yang diterima akun ini. Daftar sudah ter-scope wilayah admin dari server.
	const agencies = props.agencies ?? [];

	const jurisdictionalRoles = props.jurisdictional_roles ?? [];
	const isJurisdictional = (role) => jurisdictionalRoles.includes(role);
	// Usulan tingkat per peran hidup di roleLevel.js, dipakai bersama form Tambah Pengguna.
	const levelOptionsFor = (user) => levelOptionsForRank(props.assignable_levels, user?.region_level);
	const defaultLevelFor = (user, role) => defaultLevelForRank(props.assignable_levels, user?.region_level, role);

	const onSortable = (field) => {
		setParams({
			...params,
			field: field,
			direction: params.direction === 'asc' ? 'desc' : 'asc',
		});
	};
	UseFilter({
		route: route('admin.users.index'),
		values: params,
		only: ['users'],
	});

	const openRoleDialog = (user) => {
		const role = user.roles?.[0] ?? '';
		setData('role', role);
		setData('level', isJurisdictional(role) ? defaultLevelFor(user, role) : '');
		setData('agency_id', user.agency_id ? String(user.agency_id) : '');
		setRoleUser(user);
	};

	const onRoleChange = (value) => {
		setData('role', value);
		setData('level', isJurisdictional(value) ? defaultLevelFor(roleUser, value) : '');
		if (value !== 'opd') setData('agency_id', '');
	};

	const closeRoleDialog = () => {
		setRoleUser(null);
		reset();
	};

	const onSubmitRole = (e) => {
		e.preventDefault();
		put(route('admin.users.assign-role', [roleUser]), {
			preserveScroll: true,
			onSuccess: (success) => {
				const flash = flashMessage(success);
				if (flash) toast[flash.type](flash.message);
				closeRoleDialog();
			},
		});
	};

	const rowNumber = (index) => index + 1 + (meta.current_page - 1) * meta.per_page;

	const assignableRoles = props.assignable_roles ?? [];
	const isAssignable = (value) => assignableRoles.includes(value);
	const currentRoleLocked = (roleUser?.roles ?? []).some((role) => !isAssignable(role));

	// Kepala kolom yang bisa diurutkan: kolom yang SEDANG mengurutkan menampilkan arahnya,
	// kolom lain ikon netral - dulu semua kolom berikon sama sehingga urutan aktif tak terbaca.
	const SortHead = ({ field, children, className }) => {
		const active = params?.field === field;
		const Icon = !active ? IconArrowsSort : params?.direction === 'asc' ? IconChevronUp : IconChevronDown;
		return (
			<TableHead
				className={className}
				aria-sort={active ? (params?.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
			>
				<button
					type="button"
					onClick={() => onSortable(field)}
					className={cn(
						'-mx-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-muted active:bg-muted',
						active ? 'text-foreground' : 'text-muted-foreground',
					)}
				>
					{children}
					<Icon className={cn('size-3.5', !active && 'opacity-60')} />
				</button>
			</TableHead>
		);
	};

	return (
		<div className="flex w-full flex-col pb-32">
			<div className="mb-6 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconUsersGroup}
				/>
				<Button size="sm" className="h-10 rounded-full px-4" asChild>
					<Link href={route('admin.users.create')}>
						<IconPlus className="size-4" /> Tambah pengguna
					</Link>
				</Button>
			</div>

			<div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
				<div className="relative w-full sm:max-w-sm">
					<IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						enterKeyHint="search"
						className="h-11 rounded-xl bg-card pl-9"
						placeholder="Cari nama, email, atau nomor"
						aria-label="Cari pengguna"
						value={params?.search}
						onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value }))}
					/>
				</div>
				<div className="flex items-center gap-2">
					<Select value={params?.load} onValueChange={(e) => setParams({ ...params, load: e })}>
						<SelectTrigger
							className="h-11 w-full rounded-xl bg-card sm:w-36"
							aria-label="Jumlah per halaman"
						>
							<SelectValue placeholder="Per halaman" />
						</SelectTrigger>
						<SelectContent>
							{[10, 25, 50, 75, 100].map((number, index) => (
								<SelectItem key={index} value={number}>
									{number} per halaman
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						variant="ghost"
						className="h-11 shrink-0 rounded-xl text-muted-foreground"
						onClick={() => setParams(props.state)}
					>
						<IconRefresh className="size-4" /> Atur ulang
					</Button>
				</div>
			</div>

			{/* Tablet & desktop: tabel */}
			<div className="hidden overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm md:block">
				<div className="overflow-x-auto">
					<Table className={`w-full [&_td]:px-4 [&_th]:px-4 ${stickyActionsClass}`}>
						<TableHeader className="bg-muted/40">
							<TableRow className="hover:bg-transparent">
								<SortHead field="id" className="w-14">
									#
								</SortHead>
								<SortHead field="name">Pengguna</SortHead>
								<SortHead field="email">Email</SortHead>
								<SortHead field="phone" className="hidden lg:table-cell">
									Handphone
								</SortHead>
								<TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									Peran
								</TableHead>
								<TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									Wilayah
								</TableHead>
								<SortHead field="gender" className="hidden 2xl:table-cell">
									Jenis kelamin
								</SortHead>
								<SortHead field="created_at" className="hidden 2xl:table-cell">
									Dibuat
								</SortHead>
								<TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									Aksi
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((user, index) => (
								<TableRow key={index}>
									<TableCell className="tabular-nums text-muted-foreground">
										{rowNumber(index)}
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-x-3">
											<Avatar className="size-9">
												<AvatarImage src={user.avatar} />
												<AvatarFallback>{user.name.substring(0, 1)}</AvatarFallback>
											</Avatar>
											<div className="flex min-w-0 flex-col">
												<span className="truncate font-medium">{user.name}</span>
												<span className="truncate text-xs text-muted-foreground">
													@{user.username}
												</span>
											</div>
										</div>
									</TableCell>
									<TableCell className="text-muted-foreground">{user.email}</TableCell>
									<TableCell className="hidden tabular-nums text-muted-foreground lg:table-cell">
										{user.phone || '-'}
									</TableCell>
									<TableCell>
										<RoleBadges roles={user.roles} />
									</TableCell>
									<TableCell className="text-muted-foreground">{user.region || '-'}</TableCell>
									<TableCell className="hidden text-muted-foreground 2xl:table-cell">
										{user.gender || '-'}
									</TableCell>
									<TableCell className="hidden whitespace-nowrap text-muted-foreground 2xl:table-cell">
										{user.created_at}
									</TableCell>
									<TableCell>
										<UserActions user={user} onAssignRole={openRoleDialog} />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
				{users.length === 0 && (
					<p className="px-4 py-10 text-center text-sm text-muted-foreground">
						Tidak ada pengguna yang cocok.
					</p>
				)}
			</div>

			{/* Ponsel: satu daftar bergrup (TASK_69 bagian 16) - dulu satu kartu besar per pengguna dengan enam
			    baris ikon & bilah tombol. Ketuk baris = Ubah; Peran & Hapus jadi tombol ikon di kanan. */}
			<div className="md:hidden">
				{users.length === 0 ? (
					<p className="rounded-2xl border border-border/70 bg-card px-4 py-10 text-center text-[15px] text-muted-foreground">
						Tidak ada pengguna yang cocok.
					</p>
				) : (
					<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
						{users.map((user, index) => (
							<div key={index} className="relative flex items-start gap-3 px-4 py-3 active:bg-muted">
								<Avatar className="size-11">
									<AvatarImage src={user.avatar} />
									<AvatarFallback>{user.name.substring(0, 1)}</AvatarFallback>
								</Avatar>
								<div className="min-w-0 flex-1">
									<Link
										href={route('admin.users.edit', [user])}
										className="block break-words text-[15px] font-semibold leading-snug after:absolute after:inset-0"
									>
										{user.name}
									</Link>
									<p className="break-all text-[13px] text-muted-foreground">@{user.username}</p>
									<div className="mt-1.5">
										<RoleBadges roles={user.roles} />
									</div>
									<p className="mt-1.5 break-all text-[13px] leading-snug text-muted-foreground">
										{user.email || '-'}
									</p>
									<p className="text-[13px] leading-snug text-muted-foreground">
										{[user.phone, user.region].filter(Boolean).join(' · ') || '-'}
									</p>
								</div>
								<div className="relative z-10 flex shrink-0 items-center">
									<button
										type="button"
										onClick={() => openRoleDialog(user)}
										aria-label={`Atur peran ${user.name}`}
										className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-muted"
									>
										<IconUserShield className="size-5" />
									</button>
									<DeleteUserDialog user={user}>
										<button
											type="button"
											aria-label={`Hapus ${user.name}`}
											className="flex h-10 w-10 items-center justify-center rounded-full text-destructive transition-colors active:bg-destructive/10"
										>
											<IconTrash className="size-5" />
										</button>
									</DeleteUserDialog>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			<div className="mt-4 flex w-full flex-col items-center justify-between gap-3 lg:flex-row">
				<p className="text-sm text-muted-foreground">
					Menampilkan{' '}
					<span className="font-medium tabular-nums text-foreground">
						{meta.from ?? 0}-{meta.to ?? 0}
					</span>{' '}
					dari <span className="font-medium tabular-nums text-foreground">{meta.total}</span> pengguna
				</p>
				<PaginationLinks links={meta.links} />
			</div>

			<Dialog open={!!roleUser} onOpenChange={(open) => !open && closeRoleDialog()}>
				<DialogContent className="max-h-[90dvh] overflow-y-auto overscroll-contain">
					<DialogHeader>
						<DialogTitle>Tetapkan peran</DialogTitle>
						<DialogDescription>
							Pilih peran untuk <span className="font-medium text-foreground">{roleUser?.name}</span>.
							Peran lama akan digantikan oleh pilihan ini.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={onSubmitRole} className="space-y-4">
						<RadioGroup
							value={data.role}
							onValueChange={onRoleChange}
							className="gap-0 divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70"
						>
							{props.roles.map((role) => {
								const disabled = !isAssignable(role.value);
								return (
									<Label
										key={role.value}
										htmlFor={`role-${role.value}`}
										className={cn(
											'flex min-h-12 items-center gap-3 px-4 py-3 text-sm font-medium transition-colors has-[[data-state=checked]]:bg-primary/5',
											disabled
												? 'cursor-not-allowed opacity-50'
												: 'cursor-pointer active:bg-muted',
										)}
									>
										<RadioGroupItem
											value={role.value}
											id={`role-${role.value}`}
											disabled={disabled}
										/>
										<span>{role.label}</span>
										{disabled && (
											<span className="ml-auto text-xs font-normal text-muted-foreground">
												Terkunci
											</span>
										)}
									</Label>
								);
							})}
						</RadioGroup>
						{currentRoleLocked && (
							<p className="flex items-start gap-2 text-xs text-muted-foreground">
								<IconInfoCircle className="mt-0.5 size-4 shrink-0" />
								Peran pengguna ini di luar kewenangan Anda dan hanya dapat diubah oleh superadmin.
							</p>
						)}
						{errors.role && <InputError message={errors.role} />}

						{isJurisdictional(data.role) && (
							<div className="space-y-2">
								<Label htmlFor="level" className="text-[13px]">
									Tingkat yurisdiksi
								</Label>
								{levelOptionsFor(roleUser).length > 0 ? (
									<>
										<Select value={data.level} onValueChange={(value) => setData('level', value)}>
											<SelectTrigger id="level" className="h-11 w-full rounded-xl">
												<SelectValue placeholder="Pilih tingkat wilayah" />
											</SelectTrigger>
											<SelectContent>
												{levelOptionsFor(roleUser).map((level) => (
													<SelectItem key={level.value} value={level.value}>
														{level.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<p className="text-xs text-muted-foreground">
											Kode wilayah pengguna disesuaikan ke tingkat ini; data wilayah yang lebih
											rinci dikosongkan agar yurisdiksi tepat.
										</p>
									</>
								) : (
									<p className="flex items-start gap-2 text-xs text-muted-foreground">
										<IconInfoCircle className="mt-0.5 size-4 shrink-0" />
										Pengguna belum punya data wilayah yang memadai untuk peran ini. Lengkapi wilayah
										pengguna lewat Ubah terlebih dahulu.
									</p>
								)}
								{errors.level && <InputError message={errors.level} />}
							</div>
						)}

						{data.role === 'opd' && (
							<div className="space-y-2">
								<Label htmlFor="agency_id" className="text-[13px]">
									Instansi yang diwakili
								</Label>
								{agencies.length > 0 ? (
									<>
										<Combobox
											items={agencies.map((agency) => ({
												code: String(agency.id),
												name: agency.name,
											}))}
											value={data.agency_id ? String(data.agency_id) : ''}
											onChange={(value) => setData('agency_id', value)}
											placeholder="Pilih instansi"
											emptyText="Instansi tidak ditemukan."
											className="h-11 rounded-xl"
											modal
										/>
										<p className="text-xs text-muted-foreground">
											Akun ini akan menerima permintaan bantuan yang ditujukan ke instansi
											tersebut, dan hanya bisa mengonfirmasi tindakan atas namanya.
										</p>
									</>
								) : (
									<p className="flex items-start gap-2 text-xs text-muted-foreground">
										<IconInfoCircle className="mt-0.5 size-4 shrink-0" />
										Belum ada OPD terdaftar di wilayah Anda. Tambahkan lebih dulu lewat Manajemen
										OPD Terkait.
									</p>
								)}
								{errors.agency_id && <InputError message={errors.agency_id} />}
							</div>
						)}

						<DialogFooter className="gap-2">
							<Button type="button" variant="ghost" className="h-11 rounded-xl" onClick={closeRoleDialog}>
								Batal
							</Button>
							<Button
								type="submit"
								className="h-11 rounded-xl px-6"
								disabled={
									processing ||
									!data.role ||
									!isAssignable(data.role) ||
									(isJurisdictional(data.role) && !data.level) ||
									(data.role === 'opd' && !data.agency_id)
								}
							>
								{processing ? 'Menyimpan...' : 'Simpan peran'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
