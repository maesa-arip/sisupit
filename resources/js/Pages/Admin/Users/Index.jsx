import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
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
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/Components/ui/card';
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/Components/ui/pagination';
import { RadioGroup, RadioGroupItem } from '@/Components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import UseFilter from '@/hooks/UseFilter';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import {
	IconArrowsDownUp,
	IconCalendarTime,
	IconGenderBigender,
	IconInfoCircle,
	IconMail,
	IconMapPin,
	IconPencil,
	IconPhone,
	IconPlus,
	IconRefresh,
	IconTrash,
	IconUsersGroup,
	IconUserShield,
} from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

function RoleBadges({ roles }) {
	if (!roles || roles.length === 0) {
		return <span className="text-xs text-muted-foreground">Tanpa Peran</span>;
	}

	return roles.map((role, index) => (
		<Badge variant="outline" className="my-0.5 mr-1" key={index}>
			{role}
		</Badge>
	));
}

function DeleteUserDialog({ user }) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="red" size="sm">
					<IconTrash className="size-4" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Apakah anda benar benar yakin ?</AlertDialogTitle>
					<AlertDialogDescription>
						Tindakan ini tidak dapat dibatalkan. Tindakan ini akan menghapus data anda secara permanen dan
						menghapus data anda dari server kami
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
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
						Continue
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function UserActions({ user, onAssignRole }) {
	return (
		<div className="flex items-center gap-x-1">
			<Button variant="green" size="sm" title="Tetapkan Peran" onClick={() => onAssignRole(user)}>
				<IconUserShield className="size-4" />
			</Button>
			<Button variant="blue" size="sm" asChild>
				<Link href={route('admin.users.edit', [user])}>
					<IconPencil className="size-4" />
				</Link>
			</Button>
			<DeleteUserDialog user={user} />
		</div>
	);
}

function MobileInfo({ icon: Icon, value }) {
	return (
		<div className="flex items-center gap-2 text-sm">
			<Icon className="size-4 shrink-0 text-muted-foreground" />
			<span className="truncate">{value || '-'}</span>
		</div>
	);
}

export default function Index(props) {
	const { data: users, meta } = props.users;
	const [params, setParams] = useState(props.state);

	const [roleUser, setRoleUser] = useState(null);
	const { data, setData, put, processing, errors, reset } = useForm({ role: '', level: '' });

	const jurisdictionalRoles = props.jurisdictional_roles ?? [];
	const isJurisdictional = (role) => jurisdictionalRoles.includes(role);
	const rankToLevel = { 4: 'desa', 3: 'kecamatan', 2: 'kabupaten', 1: 'provinsi' };
	const levelOptionsFor = (user) =>
		(props.assignable_levels ?? []).filter((level) => level.rank <= (user?.region_level ?? 0));
	const defaultLevelFor = (user) => {
		const options = levelOptionsFor(user);
		if (options.length === 0) return '';
		const current = rankToLevel[user?.region_level];
		if (options.some((option) => option.value === current)) return current;
		return options.reduce((a, b) => (a.rank >= b.rank ? a : b)).value;
	};

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
		setData('level', isJurisdictional(role) ? defaultLevelFor(user) : '');
		setRoleUser(user);
	};

	const onRoleChange = (value) => {
		setData('role', value);
		setData('level', isJurisdictional(value) ? defaultLevelFor(roleUser) : '');
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

	return (
		<div className="flex w-full flex-col pb-32">
			<div className="mb-8 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconUsersGroup}
				/>
				<Button variant="orange" size="sm" asChild>
					<Link href={route('admin.users.create')}>
						<IconPlus className="size-4" /> Tambah
					</Link>
				</Button>
			</div>
			<Card>
				<CardHeader>
					<div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center">
						<Input
							className="w-full sm:w-1/4"
							placeholder="Search"
							value={params?.search}
							onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value }))}
						/>
						<Select value={params?.load} onValueChange={(e) => setParams({ ...params, load: e })}>
							<SelectTrigger className="w-full sm:w-24">
								<SelectValue placeholder="load" />
							</SelectTrigger>
							<SelectContent>
								{[10, 25, 50, 75, 100].map((number, index) => (
									<SelectItem key={index} value={number}>
										{number}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button variant="red" onClick={() => setParams(props.state)} size="sm">
							<IconRefresh className="size-4" /> Bersihkan
						</Button>
					</div>
				</CardHeader>
				<CardContent className="p-0 [&_td]:px-6 [&_th]:px-6">
					{/* Tablet & desktop: tabel */}
					<div className="hidden overflow-x-auto md:block">
						<Table className="w-full">
							<TableHeader>
								<TableRow>
									<TableHead>
										<Button
											variant="ghost"
											className="group inline-flex"
											onClick={() => onSortable('id')}
										>
											#{' '}
											<span className="ml-2 flex-none rounded text-muted-foreground">
												<IconArrowsDownUp className="size-4 text-muted-foreground" />
											</span>
										</Button>
									</TableHead>
									<TableHead>
										<Button
											variant="ghost"
											className="group inline-flex"
											onClick={() => onSortable('name')}
										>
											Pengguna
											<span className="ml-2 flex-none rounded text-muted-foreground">
												<IconArrowsDownUp className="size-4 text-muted-foreground" />
											</span>
										</Button>
									</TableHead>
									<TableHead>
										<Button
											variant="ghost"
											className="group inline-flex"
											onClick={() => onSortable('email')}
										>
											Email
											<span className="ml-2 flex-none rounded text-muted-foreground">
												<IconArrowsDownUp className="size-4 text-muted-foreground" />
											</span>
										</Button>
									</TableHead>
									<TableHead className="hidden lg:table-cell">
										<Button
											variant="ghost"
											className="group inline-flex"
											onClick={() => onSortable('phone')}
										>
											Nomor Handphone
											<span className="ml-2 flex-none rounded text-muted-foreground">
												<IconArrowsDownUp className="size-4 text-muted-foreground" />
											</span>
										</Button>
									</TableHead>
									<TableHead>Peran</TableHead>
									<TableHead>Wilayah</TableHead>
									<TableHead className="hidden lg:table-cell">
										<Button
											variant="ghost"
											className="group inline-flex"
											onClick={() => onSortable('gender')}
										>
											Jenis Kelamin
											<span className="ml-2 flex-none rounded text-muted-foreground">
												<IconArrowsDownUp className="size-4 text-muted-foreground" />
											</span>
										</Button>
									</TableHead>
									<TableHead className="hidden lg:table-cell">
										<Button
											variant="ghost"
											className="group inline-flex"
											onClick={() => onSortable('created_at')}
										>
											Dibuat pada
											<span className="ml-2 flex-none rounded text-muted-foreground">
												<IconArrowsDownUp className="size-4 text-muted-foreground" />
											</span>
										</Button>
									</TableHead>
									<TableHead>Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.map((user, index) => (
									<TableRow key={index}>
										<TableCell>{rowNumber(index)}</TableCell>
										<TableCell>
											<div className="flex items-center gap-x-3">
												<Avatar>
													<AvatarImage src={user.avatar} />
													<AvatarFallback>{user.name.substring(0, 1)}</AvatarFallback>
												</Avatar>
												<div className="flex flex-col">
													<span className="font-medium">{user.name}</span>
													<span className="text-xs text-muted-foreground">
														@{user.username}
													</span>
												</div>
											</div>
										</TableCell>
										<TableCell>{user.email}</TableCell>
										<TableCell className="hidden lg:table-cell">{user.phone}</TableCell>
										<TableCell>
											<RoleBadges roles={user.roles} />
										</TableCell>
										<TableCell>{user.region}</TableCell>
										<TableCell className="hidden lg:table-cell">{user.gender}</TableCell>
										<TableCell className="hidden lg:table-cell">{user.created_at}</TableCell>
										<TableCell>
											<UserActions user={user} onAssignRole={openRoleDialog} />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* Mobile: daftar kartu (tanpa tabel) */}
					<div className="space-y-3 p-4 md:hidden">
						{users.map((user, index) => (
							<div key={index} className="overflow-hidden rounded-xl border bg-card shadow-sm">
								<div className="flex items-center gap-3 border-b bg-muted/40 p-4">
									<Avatar className="size-11 border">
										<AvatarImage src={user.avatar} />
										<AvatarFallback>{user.name.substring(0, 1)}</AvatarFallback>
									</Avatar>
									<div className="flex min-w-0 flex-col">
										<span className="truncate font-semibold leading-tight">{user.name}</span>
										<span className="truncate text-xs text-muted-foreground">@{user.username}</span>
									</div>
									<span className="ml-auto shrink-0 text-xs text-muted-foreground">
										#{rowNumber(index)}
									</span>
								</div>
								<div className="space-y-3 p-4">
									<div className="flex flex-wrap items-center">
										<RoleBadges roles={user.roles} />
									</div>
									<div className="space-y-2">
										<MobileInfo icon={IconMail} value={user.email} />
										<MobileInfo icon={IconPhone} value={user.phone} />
										<MobileInfo icon={IconMapPin} value={user.region} />
										<MobileInfo icon={IconGenderBigender} value={user.gender} />
										<MobileInfo icon={IconCalendarTime} value={user.created_at} />
									</div>
								</div>
								<div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-3">
									<Button
										variant="green"
										size="sm"
										className="flex-1"
										onClick={() => openRoleDialog(user)}
									>
										<IconUserShield className="size-4" /> Peran
									</Button>
									<Button variant="blue" size="sm" className="flex-1" asChild>
										<Link href={route('admin.users.edit', [user])}>
											<IconPencil className="size-4" /> Edit
										</Link>
									</Button>
									<DeleteUserDialog user={user} />
								</div>
							</div>
						))}
					</div>
				</CardContent>
				<CardFooter className="flex w-full flex-col items-center justify-between border-t py-2 lg:flex-row">
					<p className="mb-2 text-sm text-muted-foreground">
						Menamplikan{' '}
						<span className="font-medium text-warning">{meta.from ?? 0}</span> dari{' '}
						{meta.total} Pengguna
					</p>
					<div className="overflow-x-auto">
						{meta.has_pages && (
							<Pagination>
								<PaginationContent className="fles-wrap flex justify-center lg:justify-end">
									{meta.links.map((link, index) => (
										<PaginationItem key={index} className="mx-1 mb-1 lg:mb-0">
											<PaginationLink href={link.url} isActive={link.active}>
												{link.label}
											</PaginationLink>
										</PaginationItem>
									))}
								</PaginationContent>
							</Pagination>
						)}
					</div>
				</CardFooter>
			</Card>

			<Dialog open={!!roleUser} onOpenChange={(open) => !open && closeRoleDialog()}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Tetapkan Peran</DialogTitle>
						<DialogDescription>
							Pilih peran untuk pengguna <span className="font-medium">{roleUser?.name}</span>. Peran lama
							akan digantikan oleh pilihan ini.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={onSubmitRole} className="space-y-4">
						<RadioGroup value={data.role} onValueChange={onRoleChange} className="gap-2">
							{props.roles.map((role) => {
								const disabled = !isAssignable(role.value);
								return (
									<Label
										key={role.value}
										htmlFor={`role-${role.value}`}
										className={`flex items-center gap-3 rounded-md border p-3 ${
											disabled
												? 'cursor-not-allowed opacity-60'
												: 'cursor-pointer hover:bg-accent'
										}`}
									>
										<RadioGroupItem
											value={role.value}
											id={`role-${role.value}`}
											disabled={disabled}
										/>
										<span>{role.label}</span>
										{disabled && (
											<span className="ml-auto text-xs text-muted-foreground">Terkunci</span>
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
							<div className="space-y-2 border-t pt-2">
								<Label htmlFor="level">Tingkat Yurisdiksi</Label>
								{levelOptionsFor(roleUser).length > 0 ? (
									<>
										<Select value={data.level} onValueChange={(value) => setData('level', value)}>
											<SelectTrigger id="level" className="w-full">
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
										pengguna lewat Edit terlebih dahulu.
									</p>
								)}
								{errors.level && <InputError message={errors.level} />}
							</div>
						)}

						<DialogFooter className="gap-2">
							<Button type="button" variant="secondary" size="sm" onClick={closeRoleDialog}>
								Batal
							</Button>
							<Button
								type="submit"
								variant="orange"
								size="sm"
								disabled={
									processing ||
									!data.role ||
									!isAssignable(data.role) ||
									(isJurisdictional(data.role) && !data.level)
								}
							>
								Simpan
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
