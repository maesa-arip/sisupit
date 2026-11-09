import { FormField, FormSection, LockedField, fieldInputClass } from '@/Components/GroupedForm';
import HeaderTitle from '@/Components/HeaderTitle';
import DotPill from '@/Components/DotPill';
import { Button } from '@/Components/ui/button';
import { Combobox } from '@/Components/ui/combobox';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconMailForward, IconTrash, IconUserPlus } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { defaultLevelFor, levelOptionsFor, regionRankOf } from './roleLevel';

const STATUS = {
	menunggu: { label: 'Menunggu', tone: 'warning' },
	diterima: { label: 'Diterima', tone: 'success' },
	kedaluwarsa: { label: 'Kedaluwarsa', tone: 'muted' },
};

const tanggal = (iso) =>
	iso
		? new Date(iso).toLocaleString('id-ID', {
				day: 'numeric',
				month: 'short',
				hour: '2-digit',
				minute: '2-digit',
				timeZone: 'Asia/Makassar',
			})
		: '-';

const toastFlash = (page) => {
	const flash = flashMessage(page);
	if (flash?.message) toast[flash.type || 'success'](flash.message);
};

/**
 * Undang Petugas lewat email (2026-11-06, UserController::invitations). Wilayah TUGAS dipilih
 * dengan kunci yang sama dengan Tambah Pengguna: tingkat wilayah admin terkunci, lebih rinci
 * dipilih. Tingkat yurisdiksi diusulkan lewat roleLevel.js (petugas -> kabupaten).
 */
export default function Invite(props) {
	const { data, setData, post, processing, errors, reset } = useForm({
		email: '',
		province_code: props.admin_level?.province_code || '',
		city_code: props.admin_level?.city_code || '',
		district_code: props.admin_level?.district_code || '',
		village_code: props.admin_level?.village_code || '',
		level: '',
	});

	const regionRank = regionRankOf(data);
	const levelOptions = levelOptionsFor(props.assignable_levels, regionRank);

	useEffect(() => {
		setData('level', defaultLevelFor(props.assignable_levels, regionRank, 'petugas'));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [regionRank]);

	const [cities, setCities] = useState(props.cities || []);
	const [districts, setDistricts] = useState(props.districts || []);
	const [villages, setVillages] = useState([]);

	useEffect(() => {
		if (!props.admin_level?.city_code && data.province_code) {
			fetch(`/api/regions/cities/${data.province_code}`)
				.then((res) => res.json())
				.then(setCities);
		}
	}, [data.province_code]);

	useEffect(() => {
		if (!props.admin_level?.district_code && data.city_code) {
			fetch(`/api/regions/districts/${data.city_code}`)
				.then((res) => res.json())
				.then(setDistricts);
		}
	}, [data.city_code]);

	useEffect(() => {
		if (!props.admin_level?.village_code && data.district_code) {
			fetch(`/api/regions/villages/${data.district_code}`)
				.then((res) => res.json())
				.then(setVillages);
		}
	}, [data.district_code]);

	const submit = (e) => {
		e.preventDefault();
		post(route('admin.users.invitations.store'), {
			preserveScroll: true,
			onSuccess: (page) => {
				toastFlash(page);
				reset('email');
			},
		});
	};

	const cancel = (id) =>
		router.delete(route('admin.users.invitations.destroy', id), { preserveScroll: true, onSuccess: toastFlash });

	const invitations = props.invitations ?? [];

	return (
		<div className="flex w-full flex-col pb-32">
			<div className="mb-6 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconUserPlus}
				/>
				<Button variant="outline" size="sm" className="rounded-full" asChild>
					<Link href={route('admin.users.index')}>
						<IconArrowLeft className="size-4" />
						Kembali
					</Link>
				</Button>
			</div>

			<form className="w-full max-w-2xl space-y-8" onSubmit={submit}>
				<FormSection
					title="Email petugas"
					description={`Tautan undangan berlaku ${props.valid_days} hari dan hanya bisa dipakai sekali. Bila email ini sudah punya akun warga/relawan, akun itu yang diangkat menjadi petugas.`}
				>
					<FormField label="Email" htmlFor="email" error={errors.email}>
						<Input
							id="email"
							type="email"
							inputMode="email"
							autoCapitalize="none"
							autoComplete="email"
							value={data.email}
							placeholder="nama@contoh.com"
							className={fieldInputClass}
							onChange={(e) => setData('email', e.target.value.toLowerCase())}
						/>
					</FormField>
				</FormSection>

				<FormSection
					title="Wilayah tugas"
					description="Wilayah damkar tempat ia BERTUGAS, bukan tempat tinggalnya. Wilayah ini menentukan laporan dan notifikasi yang ia terima; penerima tidak bisa mengubahnya sendiri."
				>
					{props.admin_level?.province_code ? (
						<LockedField label="Provinsi" value={props.admin_region_names?.province} />
					) : (
						<FormField label="Provinsi">
							<Combobox
								items={props.provinces}
								value={data.province_code}
								className={fieldInputClass}
								onChange={(val) =>
									setData((prev) => ({
										...prev,
										province_code: val,
										city_code: '',
										district_code: '',
										village_code: '',
									}))
								}
								placeholder="Pilih provinsi"
							/>
						</FormField>
					)}
					{props.admin_level?.city_code ? (
						<LockedField label="Kabupaten / Kota" value={props.admin_region_names?.city} />
					) : (
						<FormField label="Kabupaten / Kota">
							<Combobox
								items={cities}
								value={data.city_code}
								disabled={!data.province_code}
								className={fieldInputClass}
								onChange={(val) =>
									setData((prev) => ({
										...prev,
										city_code: val,
										district_code: '',
										village_code: '',
									}))
								}
								placeholder="Pilih kabupaten/kota"
							/>
						</FormField>
					)}
					{props.admin_level?.district_code ? (
						<LockedField label="Kecamatan" value={props.admin_region_names?.district} />
					) : (
						<FormField label="Kecamatan" hint="Kosongkan bila petugas bertugas di seluruh kabupaten/kota.">
							<Combobox
								items={districts}
								value={data.district_code}
								disabled={!data.city_code}
								className={fieldInputClass}
								onChange={(val) =>
									setData((prev) => ({ ...prev, district_code: val, village_code: '' }))
								}
								placeholder="Pilih kecamatan (opsional)"
							/>
						</FormField>
					)}
					{props.admin_level?.village_code ? (
						<LockedField label="Kelurahan / Desa" value={props.admin_region_names?.village} />
					) : (
						data.district_code && (
							<FormField label="Kelurahan / Desa" hint="Opsional.">
								<Combobox
									items={villages}
									value={data.village_code}
									className={fieldInputClass}
									onChange={(val) => setData('village_code', val)}
									placeholder="Pilih kelurahan/desa (opsional)"
								/>
							</FormField>
						)
					)}
					<FormField label="Tingkat yurisdiksi" htmlFor="level" error={errors.level}>
						<Select value={data.level} onValueChange={(value) => setData('level', value)}>
							<SelectTrigger id="level" className={fieldInputClass} disabled={levelOptions.length === 0}>
								<SelectValue placeholder="Pilih wilayah di atas dulu" />
							</SelectTrigger>
							<SelectContent>
								{levelOptions.map((level) => (
									<SelectItem key={level.value} value={level.value}>
										{level.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FormField>
				</FormSection>

				<div className="flex justify-end">
					<Button
						type="submit"
						className="h-11 rounded-xl px-6"
						disabled={processing || !data.email || !data.level}
					>
						<IconMailForward className="size-4" /> {processing ? 'Mengirim...' : 'Kirim undangan'}
					</Button>
				</div>
			</form>

			<section className="mt-10 w-full max-w-2xl">
				<h2 className="mb-3 text-[15px] font-semibold text-foreground">Undangan terakhir</h2>
				{invitations.length === 0 ? (
					<p className="rounded-2xl border border-border/70 bg-card p-4 text-sm text-muted-foreground">
						Belum ada undangan.
					</p>
				) : (
					<ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card">
						{invitations.map((inv) => (
							<li key={inv.id} className="flex items-center gap-3 px-4 py-3">
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-foreground">{inv.email}</p>
									<p className="truncate text-xs capitalize text-muted-foreground">
										{(inv.region || '-').toLowerCase()} · dikirim {tanggal(inv.created_at)}
										{inv.inviter ? ` oleh ${inv.inviter}` : ''}
									</p>
								</div>
								<DotPill tone={STATUS[inv.status]?.tone} className="shrink-0">
									{STATUS[inv.status]?.label ?? inv.status}
								</DotPill>
								{inv.status === 'menunggu' && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => cancel(inv.id)}
										className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
										title="Batalkan undangan"
									>
										<IconTrash className="size-4" />
										<span className="sr-only">Batalkan undangan {inv.email}</span>
									</Button>
								)}
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}

Invite.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
