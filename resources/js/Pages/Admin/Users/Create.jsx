import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Combobox } from '@/Components/ui/combobox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconCategory, IconLock, IconUsersGroup } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const LockedField = ({ label, value }) => (
	<div className="grid gap-1.5">
		<Label className="text-muted-foreground">{label}</Label>
		<div className="relative">
			<Input
				readOnly
				value={value || 'Memuat...'}
				className="pr-10 font-medium border-dashed shadow-none bg-accent/50 text-muted-foreground focus-visible:ring-0"
			/>
			<IconLock className="absolute w-4 h-4 -translate-y-1/2 opacity-50 right-3 top-1/2 text-muted-foreground" />
		</div>
	</div>
);

export default function Create(props) {
	const fileInputAvatar = useRef(null);
	const { data, setData, reset, post, processing, errors } = useForm({
		name: '',
		email: '',
		password: '',
		password_confirmation: '',
		avatar: null,
		gender: null,
		date_of_birth:'',
		address:'',
		phone:'',
		province_code: props.admin_level?.province_code || '',
		city_code: props.admin_level?.city_code || '',
		district_code: props.admin_level?.district_code || '',
		village_code: props.admin_level?.village_code || '',
		_method: props.page_settings.method,
	});
	const onHandleChange = (e) => setData(e.target.name, e.target.value);

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
		<div className="flex flex-col w-full pb-32">
			<div className="flex flex-col items-start justify-between mb-8 gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconUsersGroup}
				/>
				<Button variant="orange" size="sm" asChild>
					<Link href={route('admin.users.index')}>
						<IconArrowLeft className="size-4" />
						Kembali
					</Link>
				</Button>
			</div>
			<Card>
				<CardContent className="p-6">
					<form className="space-y-6" onSubmit={onHandleSubmit}>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="name">Nama</Label>
							<Input
								name="name"
								id="name"
								value={data.name}
								type="text"
								placeholder="Masukan nama..."
								onChange={onHandleChange}
							/>
							{errors.name && <InputError message={errors.name} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="email">Email</Label>
							<Input
								name="email"
								id="email"
								value={data.email}
								type="text"
								placeholder="Masukan email..."
								onChange={onHandleChange}
							/>
							{errors.email && <InputError message={errors.email} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="password">Password</Label>
							<Input
								name="password"
								id="password"
								value={data.password}
								type="password"
								placeholder="Masukan password..."
								onChange={onHandleChange}
							/>
							{errors.password && <InputError message={errors.password} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="password_confirmation">Konfirmasi Password</Label>
							<Input
								name="password_confirmation"
								id="password_confirmation"
								value={data.password_confirmation}
								type="password"
								placeholder="Masukan konfirmasi password..."
								onChange={onHandleChange}
							/>
							{errors.password_confirmation && <InputError message={errors.password_confirmation} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="phone">Nomor Handphone</Label>
							<Input
								name="phone"
								id="phone"
								value={data.phone}
								type="text"
								placeholder="Masukan nomor handphone..."
								onChange={onHandleChange}
							/>
							{errors.phone && <InputError message={errors.phone} />}
						</div>
						<div className="flex flex-col gap-4 p-4 border rounded-lg border-border bg-accent/30">
							<h4 className="text-xs font-bold uppercase text-muted-foreground">Wilayah Penugasan</h4>
							<p className="text-xs leading-relaxed text-muted-foreground">{getHelperText()}</p>

							<div className="grid gap-1.5">
								{props.admin_level?.province_code ? (
									<LockedField label="Provinsi" value={props.admin_region_names?.province} />
								) : (
									<>
										<Label>Provinsi</Label>
										<Combobox
											items={props.provinces}
											value={data.province_code}
											onChange={(val) =>
												setData((prev) => ({
													...prev,
													province_code: val,
													city_code: '',
													district_code: '',
													village_code: '',
												}))
											}
											placeholder="Pilih Provinsi..."
										/>
										{errors.province_code && <InputError message={errors.province_code} />}
									</>
								)}
							</div>

							<div className="grid gap-1.5">
								{props.admin_level?.city_code ? (
									<LockedField label="Kabupaten / Kota" value={props.admin_region_names?.city} />
								) : (
									<>
										<Label>Kabupaten / Kota</Label>
										<Combobox
											items={dynamicCities}
											value={data.city_code}
											disabled={!data.province_code}
											onChange={(val) =>
												setData((prev) => ({
													...prev,
													city_code: val,
													district_code: '',
													village_code: '',
												}))
											}
											placeholder="Pilih Kabupaten/Kota..."
										/>
										{errors.city_code && <InputError message={errors.city_code} />}
									</>
								)}
							</div>

							<div className="grid gap-1.5">
								{props.admin_level?.district_code ? (
									<LockedField label="Kecamatan" value={props.admin_region_names?.district} />
								) : (
									<>
										<Label>Kecamatan</Label>
										<Combobox
											items={dynamicDistricts}
											value={data.district_code}
											disabled={!data.city_code}
											onChange={(val) =>
												setData((prev) => ({ ...prev, district_code: val, village_code: '' }))
											}
											placeholder="Pilih Kecamatan..."
										/>
										{errors.district_code && <InputError message={errors.district_code} />}
									</>
								)}
							</div>

							<div className="grid gap-1.5">
								{props.admin_level?.village_code ? (
									<LockedField label="Kelurahan / Desa" value={props.admin_region_names?.village} />
								) : (
									<>
										<Label>Kelurahan / Desa</Label>
										<Combobox
											items={villages}
											value={data.village_code}
											disabled={!data.district_code}
											onChange={(val) => setData('village_code', val)}
											placeholder="Pilih Kelurahan/Desa..."
										/>
										{errors.village_code && <InputError message={errors.village_code} />}
									</>
								)}
							</div>
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="avatar">Avatar</Label>
							<Input
								name="avatar"
								id="avatar"
								type="file"
								ref={fileInputAvatar}
								onChange={(e) => setData(e.target.name, e.target.files[0])}
							/>
							{errors.avatar && <InputError message={errors.avatar} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="gender">Jenis Kelamin</Label>
							<Select
								defaultValue={data.gender}
								onValueChange={(value) => setData('gender', value)}
							>
								<SelectTrigger>
									<SelectValue>
										{props.genders.find(
											(gender) => gender.value == data.gender,
										)?.label ?? 'Pilih Jenis Kelamin'}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{props.genders.map((gender, index) => (
										<SelectItem key={index} value={gender.value}>
											{gender.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.gender && <InputError message={errors.gender} />}
						</div>
						<div className="flex justify-end gap-x-2">
							<Button type="button" variant="secondary" size="sm" onClick={onHandleReset}>
								Reset
							</Button>
							<Button type="submit" variant="orange" size="sm" disabled={processing}>
								Save
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
Create.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
