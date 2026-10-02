import { FormField, FormSection, LockedField, SegmentedControl, fieldInputClass } from '@/Components/GroupedForm';
import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { Combobox } from '@/Components/ui/combobox';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import AppLayout from '@/Layouts/AppLayout';
import { compressImage } from '@/lib/compress-image';
import { flashMessage } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconInfoCircle, IconUsersGroup } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { defaultLevelFor, levelOptionsFor, regionRankOf } from './roleLevel';

export default function Create(props) {
	const fileInputAvatar = useRef(null);
	// Tombol Simpan ditahan selama foto dikompres (#132).
	const [compressing, setCompressing] = useState(false);
	const setCompressedFile = async (key, file) => {
		if (!file) return setData(key, null);
		setCompressing(true);
		const compressed = await compressImage(file);
		setCompressing(false);
		setData(key, compressed);
	};

	const { data, setData, reset, post, processing, errors } = useForm({
		name: '',
		email: '',
		password: '',
		password_confirmation: '',
		avatar: null,
		gender: null,
		date_of_birth: '',
		address: '',
		phone: '',
		province_code: props.admin_level?.province_code || '',
		city_code: props.admin_level?.city_code || '',
		district_code: props.admin_level?.district_code || '',
		village_code: props.admin_level?.village_code || '',
		role: '',
		level: '',
		agency_id: '',
		_method: props.page_settings.method,
	});
	const onHandleChange = (e) => setData(e.target.name, e.target.value);

	// Peran ditetapkan langsung saat membuat akun; server memvalidasinya dengan aturan yang
	// sama dengan dialog "Tetapkan Peran" di daftar pengguna.
	const roles = props.roles ?? [];
	const agencies = props.agencies ?? [];
	const isJurisdictional = (role) => (props.jurisdictional_roles ?? []).includes(role);
	const regionRank = regionRankOf(data);
	const levelOptions = levelOptionsFor(props.assignable_levels, regionRank);

	// Tingkat mengikuti peran DAN wilayah yang diisi: mengganti kecamatan/desa bisa membuat
	// tingkat terpilih tak lagi tersedia, jadi usulannya dihitung ulang.
	useEffect(() => {
		setData(
			'level',
			isJurisdictional(data.role) ? defaultLevelFor(props.assignable_levels, regionRank, data.role) : '',
		);
	}, [data.role, regionRank]);

	const onRoleChange = (value) =>
		setData((prev) => ({ ...prev, role: value, agency_id: value === 'opd' ? prev.agency_id : '' }));

	const [dynamicCities, setDynamicCities] = useState(props.cities || []);
	const [dynamicDistricts, setDynamicDistricts] = useState(props.districts || []);
	const [villages, setVillages] = useState([]);

	useEffect(() => {
		if (!props.admin_level?.city_code && data.province_code) {
			fetch(`/api/regions/cities/${data.province_code}`)
				.then((res) => res.json())
				.then((resData) => setDynamicCities(resData));
		}
	}, [data.province_code]);

	useEffect(() => {
		if (!props.admin_level?.city_code && data.city_code) {
			fetch(`/api/regions/districts/${data.city_code}`)
				.then((res) => res.json())
				.then((resData) => setDynamicDistricts(resData));
		}
	}, [data.city_code]);

	useEffect(() => {
		if (data.district_code && !props.admin_level?.village_code) {
			fetch(`/api/regions/villages/${data.district_code}`)
				.then((res) => res.json())
				.then((resData) => setVillages(resData));
		}
	}, [data.district_code]);

	const getHelperText = () => {
		if (props.admin_level?.village_code)
			return 'Wewenang Desa: Pengguna baru akan otomatis terdaftar di wilayah desa Anda.';
		if (props.admin_level?.district_code)
			return 'Wewenang Kecamatan: Anda dapat menempatkan pengguna baru di tingkat Kelurahan/Desa pada kecamatan Anda.';
		if (props.admin_level?.city_code)
			return 'Wewenang Kabupaten/Kota: Anda dapat menempatkan pengguna baru di tingkat Kecamatan hingga Desa.';
		if (props.admin_level?.province_code)
			return 'Wewenang Provinsi: Anda dapat menempatkan pengguna baru di tingkat Kabupaten hingga Desa.';
		return 'Wewenang Pusat: Anda dapat menempatkan pengguna baru di seluruh wilayah Indonesia.';
	};

	const onHandleSubmit = (e) => {
		e.preventDefault();
		post(props.page_settings.action, {
			preserveScroll: true,
			preserveState: true,
			onSuccess: (success) => {
				const flash = flashMessage(success);
				if (flash) toast[flash.type](flash.message);
			},
		});
	};
	const onHandleReset = () => {
		reset();
		fileInputAvatar.current.value = null;
	};
	return (
		<div className="flex w-full flex-col pb-32">
			<div className="mb-6 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconUsersGroup}
				/>
				<Button variant="outline" size="sm" className="rounded-full" asChild>
					<Link href={route('admin.users.index')}>
						<IconArrowLeft className="size-4" />
						Kembali
					</Link>
				</Button>
			</div>
			<form className="w-full max-w-2xl space-y-8" onSubmit={onHandleSubmit}>
				<FormSection title="Identitas">
					<FormField label="Nama lengkap" htmlFor="name" error={errors.name}>
						<Input
							name="name"
							id="name"
							value={data.name}
							type="text"
							autoComplete="name"
							placeholder="Nama sesuai identitas"
							className={fieldInputClass}
							onChange={onHandleChange}
						/>
					</FormField>
					<FormField label="Email" htmlFor="email" error={errors.email}>
						<Input
							name="email"
							id="email"
							value={data.email}
							type="email"
							inputMode="email"
							autoCapitalize="none"
							autoComplete="email"
							placeholder="nama@contoh.com"
							className={fieldInputClass}
							onChange={onHandleChange}
						/>
					</FormField>
					<FormField label="Nomor handphone" htmlFor="phone" error={errors.phone}>
						<Input
							name="phone"
							id="phone"
							value={data.phone}
							type="tel"
							inputMode="tel"
							autoComplete="tel"
							placeholder="08xxxxxxxxxx"
							className={fieldInputClass}
							onChange={onHandleChange}
						/>
					</FormField>
					{/* Alamat tinggal TERPISAH dari wilayah akun (TASK_61): bagi petugas, wilayah
					    akun = wilayah TUGAS, bukan tempat tinggalnya. */}
					<FormField label="Alamat tinggal" htmlFor="address" error={errors.address}>
						<Input
							name="address"
							id="address"
							value={data.address}
							type="text"
							autoComplete="street-address"
							placeholder="Jalan, nomor rumah, desa, kabupaten"
							className={fieldInputClass}
							onChange={onHandleChange}
						/>
					</FormField>
					<FormField label="Jenis kelamin" error={errors.gender}>
						<SegmentedControl
							ariaLabel="Jenis kelamin"
							options={props.genders}
							value={data.gender}
							onChange={(value) => setData('gender', value)}
						/>
					</FormField>
					<FormField
						label="Foto profil"
						htmlFor="avatar"
						hint="Opsional. Foto dikompres otomatis sebelum diunggah."
						error={errors.avatar}
					>
						<Input
							name="avatar"
							id="avatar"
							type="file"
							accept="image/*"
							ref={fileInputAvatar}
							className="h-auto rounded-xl border-transparent bg-muted/60 p-2 text-[15px] text-muted-foreground file:mr-3 file:rounded-full file:bg-primary/10 file:px-3.5 file:py-1.5 file:text-[13px] file:font-semibold file:text-primary"
							onChange={(e) => setCompressedFile(e.target.name, e.target.files[0])}
						/>
					</FormField>
				</FormSection>

				<FormSection title="Kata sandi">
					<FormField label="Kata sandi" htmlFor="password" error={errors.password}>
						<Input
							name="password"
							id="password"
							value={data.password}
							type="password"
							autoComplete="new-password"
							placeholder="Kata sandi baru"
							className={fieldInputClass}
							onChange={onHandleChange}
						/>
					</FormField>
					<FormField
						label="Ulangi kata sandi"
						htmlFor="password_confirmation"
						error={errors.password_confirmation}
					>
						<Input
							name="password_confirmation"
							id="password_confirmation"
							value={data.password_confirmation}
							type="password"
							autoComplete="new-password"
							placeholder="Ketik ulang kata sandi"
							className={fieldInputClass}
							onChange={onHandleChange}
						/>
					</FormField>
				</FormSection>

				<FormSection
					title="Wilayah akun"
					description={`Bagi petugas, isi dengan wilayah TUGAS (wilayah damkar tempat ia bertugas), bukan tempat tinggalnya - wilayah ini menentukan laporan dan notifikasi yang ia terima. Bagi warga dan relawan, isi dengan wilayah tempat tinggal. ${getHelperText()}`}
				>
					{props.admin_level?.province_code ? (
						<LockedField label="Provinsi" value={props.admin_region_names?.province} />
					) : (
						<FormField label="Provinsi" error={errors.province_code}>
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
						<FormField label="Kabupaten / Kota" error={errors.city_code}>
							<Combobox
								items={dynamicCities}
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
						<FormField label="Kecamatan" error={errors.district_code}>
							<Combobox
								items={dynamicDistricts}
								value={data.district_code}
								disabled={!data.city_code}
								className={fieldInputClass}
								onChange={(val) =>
									setData((prev) => ({ ...prev, district_code: val, village_code: '' }))
								}
								placeholder="Pilih kecamatan"
							/>
						</FormField>
					)}
					{props.admin_level?.village_code ? (
						<LockedField label="Kelurahan / Desa" value={props.admin_region_names?.village} />
					) : (
						<FormField label="Kelurahan / Desa" error={errors.village_code}>
							<Combobox
								items={villages}
								value={data.village_code}
								disabled={!data.district_code}
								className={fieldInputClass}
								onChange={(val) => setData('village_code', val)}
								placeholder="Pilih kelurahan/desa"
							/>
						</FormField>
					)}
				</FormSection>

				<FormSection
					title="Peran"
					description="Akun yang dibuat admin langsung aktif tanpa verifikasi email. Pastikan alamat email benar - lupa kata sandi dikirim ke alamat ini."
				>
					<FormField label="Peran pengguna" htmlFor="role" error={errors.role}>
						<Select value={data.role} onValueChange={onRoleChange}>
							<SelectTrigger id="role" className={fieldInputClass}>
								<SelectValue placeholder="Pilih peran" />
							</SelectTrigger>
							<SelectContent>
								{roles.map((role) => (
									<SelectItem key={role.value} value={role.value}>
										{role.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FormField>

					{isJurisdictional(data.role) && (
						<FormField
							label="Tingkat yurisdiksi"
							htmlFor="level"
							hint={
								levelOptions.length > 0
									? 'Kode wilayah akun disesuaikan ke tingkat ini; wilayah yang lebih rinci dikosongkan agar yurisdiksi tepat.'
									: null
							}
							error={errors.level}
						>
							{levelOptions.length > 0 ? (
								<Select value={data.level} onValueChange={(value) => setData('level', value)}>
									<SelectTrigger id="level" className={fieldInputClass}>
										<SelectValue placeholder="Pilih tingkat wilayah" />
									</SelectTrigger>
									<SelectContent>
										{levelOptions.map((level) => (
											<SelectItem key={level.value} value={level.value}>
												{level.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<p className="flex items-start gap-2 text-xs text-muted-foreground">
									<IconInfoCircle className="mt-0.5 size-4 shrink-0" />
									Isi Wilayah Akun di atas lebih dulu untuk memilih tingkat yurisdiksi.
								</p>
							)}
						</FormField>
					)}

					{data.role === 'opd' && (
						<FormField label="Instansi yang diwakili" htmlFor="agency_id" error={errors.agency_id}>
							{agencies.length > 0 ? (
								<Combobox
									items={agencies.map((agency) => ({
										code: String(agency.id),
										name: agency.name,
									}))}
									value={data.agency_id ? String(data.agency_id) : ''}
									className={fieldInputClass}
									onChange={(value) => setData('agency_id', value)}
									placeholder="Pilih instansi"
									emptyText="Instansi tidak ditemukan."
								/>
							) : (
								<p className="flex items-start gap-2 text-xs text-muted-foreground">
									<IconInfoCircle className="mt-0.5 size-4 shrink-0" />
									Belum ada OPD terdaftar di wilayah Anda. Tambahkan lebih dulu lewat Manajemen OPD
									Terkait.
								</p>
							)}
						</FormField>
					)}
				</FormSection>

				<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button type="button" variant="ghost" className="h-11 rounded-xl" onClick={onHandleReset}>
						Atur ulang
					</Button>
					<Button
						type="submit"
						className="h-11 rounded-xl px-6"
						disabled={
							processing ||
							compressing ||
							!data.role ||
							(isJurisdictional(data.role) && !data.level) ||
							(data.role === 'opd' && !data.agency_id)
						}
					>
						{compressing ? 'Memproses foto...' : processing ? 'Menyimpan...' : 'Simpan pengguna'}
					</Button>
				</div>
			</form>
		</div>
	);
}
Create.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
