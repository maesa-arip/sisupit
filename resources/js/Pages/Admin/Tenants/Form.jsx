import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import { Combobox } from '@/Components/ui/combobox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage, NOMOR_DARURAT_NASIONAL } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconBuildingCommunity, IconInfoCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Foto pejabat bisa berupa path publik statis (mis. /images/pejabat.jpg dari config lama)
// atau hasil upload di disk 'public' (mis. tenants/xxx.jpg). Normalkan ke URL yang bisa dirender.
const fotoUrl = (path) => {
	if (!path) return null;
	if (path.startsWith('http') || path.startsWith('/')) return path;
	return `/storage/${path}`;
};

export default function Form(props) {
	const { tenant, provinces, page_settings, app_base_domain, editions } = props;

	const { data, setData, post, processing, errors, reset } = useForm({
		subdomain: tenant?.subdomain || '',
		province_code: tenant?.province_code || '',
		city_code: tenant?.city_code || '',
		nama_instansi: tenant?.nama_instansi || '',
		pejabat_nama: tenant?.pejabat_nama || '',
		pejabat_jabatan: tenant?.pejabat_jabatan || '',
		telepon_darurat: tenant?.telepon_darurat || '',
		email_kontak: tenant?.email_kontak || '',
		alamat_instansi: tenant?.alamat_instansi || '',
		penanggung_jawab_data: tenant?.penanggung_jawab_data || '',
		edition: tenant?.edition || 'sewa',
		pejabat_foto: null,
		is_active: tenant ? Boolean(tenant.is_active) : true,
		_method: page_settings.method,
	});

	const [cities, setCities] = useState(props.cities || []);
	const onHandleChange = (e) => setData(e.target.name, e.target.value);

	// Muat daftar kota saat provinsi berubah oleh user (lewati muatan awal yang sudah dikirim server).
	const [provinceTouched, setProvinceTouched] = useState(false);
	useEffect(() => {
		if (!provinceTouched || !data.province_code) return;
		fetch(`/api/regions/cities/${data.province_code}`)
			.then((res) => res.json())
			.then((resData) => setCities(resData));
	}, [data.province_code, provinceTouched]);

	const onHandleSubmit = (e) => {
		e.preventDefault();
		post(page_settings.action, {
			preserveScroll: true,
			forceFormData: true,
			onSuccess: (success) => {
				const flash = flashMessage(success);
				if (flash) toast[flash.type](flash.message);
			},
		});
	};

	const currentFoto = fotoUrl(tenant?.pejabat_foto);

	return (
		<div className="flex w-full flex-col pb-32">
			<div className="mb-8 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={page_settings.title}
					subtitle={page_settings.subtitle}
					icon={IconBuildingCommunity}
				/>
				<Button variant="orange" size="sm" asChild>
					<Link href={route('admin.tenants.index')}>
						<IconArrowLeft className="size-4" /> Kembali
					</Link>
				</Button>
			</div>

			<Card className="max-w-3xl">
				<CardContent className="p-6">
					<form className="space-y-6" onSubmit={onHandleSubmit}>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="subdomain">Subdomain</Label>
							<Input
								name="subdomain"
								id="subdomain"
								value={data.subdomain}
								onChange={onHandleChange}
								placeholder="badung"
								autoCapitalize="none"
							/>
							<p className="text-xs text-muted-foreground">
								Alamat publik:{' '}
								<span className="font-mono text-foreground">
									{(data.subdomain || 'subdomain').toLowerCase()}.{app_base_domain}
								</span>
							</p>
							{errors.subdomain && <InputError message={errors.subdomain} />}
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="grid w-full items-center gap-1.5">
								<Label>Provinsi</Label>
								<Combobox
									items={provinces}
									value={data.province_code}
									onChange={(val) => {
										setProvinceTouched(true);
										setData((prev) => ({ ...prev, province_code: val, city_code: '' }));
									}}
									placeholder="Pilih Provinsi..."
								/>
								{errors.province_code && <InputError message={errors.province_code} />}
							</div>
							<div className="grid w-full items-center gap-1.5">
								<Label>Kabupaten / Kota</Label>
								<Combobox
									items={cities}
									value={data.city_code}
									disabled={!data.province_code}
									onChange={(val) => setData('city_code', val)}
									placeholder="Pilih Kabupaten/Kota..."
								/>
								{errors.city_code && <InputError message={errors.city_code} />}
							</div>
						</div>

						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="nama_instansi">Nama Instansi</Label>
							<Input
								name="nama_instansi"
								id="nama_instansi"
								value={data.nama_instansi}
								onChange={onHandleChange}
								placeholder="Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Badung"
							/>
							{errors.nama_instansi && <InputError message={errors.nama_instansi} />}
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="grid w-full items-center gap-1.5">
								<Label htmlFor="pejabat_nama">Nama Pejabat</Label>
								<Input
									name="pejabat_nama"
									id="pejabat_nama"
									value={data.pejabat_nama}
									onChange={onHandleChange}
									placeholder="Nama lengkap + gelar"
								/>
								{errors.pejabat_nama && <InputError message={errors.pejabat_nama} />}
							</div>
							<div className="grid w-full items-center gap-1.5">
								<Label htmlFor="telepon_darurat">Telepon Darurat</Label>
								<Input
									name="telepon_darurat"
									id="telepon_darurat"
									value={data.telepon_darurat}
									onChange={onHandleChange}
									placeholder={`0361-223333 atau ${NOMOR_DARURAT_NASIONAL}`}
								/>
								<p className="text-xs text-muted-foreground">
									Ditampilkan di halaman "Laporan Diterima". Pastikan nomor aktif.
								</p>
								{errors.telepon_darurat && <InputError message={errors.telepon_darurat} />}
							</div>
						</div>

						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="pejabat_jabatan">Jabatan Pejabat</Label>
							<Input
								name="pejabat_jabatan"
								id="pejabat_jabatan"
								value={data.pejabat_jabatan}
								onChange={onHandleChange}
								placeholder="Kepala Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Badung"
							/>
							{errors.pejabat_jabatan && <InputError message={errors.pejabat_jabatan} />}
						</div>

						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="pejabat_foto">Foto Pejabat</Label>
							{currentFoto && (
								<img
									src={currentFoto}
									alt="Foto pejabat saat ini"
									className="h-24 w-24 rounded-md border object-cover"
								/>
							)}
							<Input
								type="file"
								name="pejabat_foto"
								id="pejabat_foto"
								accept="image/png,image/jpeg,image/webp"
								onChange={(e) => setData('pejabat_foto', e.target.files?.[0] ?? null)}
							/>
							<p className="text-xs text-muted-foreground">
								Kosongkan bila tidak ingin mengganti. JPG/PNG/WEBP, maks 2MB.
							</p>
							{errors.pejabat_foto && <InputError message={errors.pejabat_foto} />}
						</div>

						{/* Paket layanan + kontak resmi: dipakai halaman Syarat & Ketentuan,
						    Kebijakan Privasi, dan Paket & Lisensi (TASK_19). Bukan kosmetik —
						    klausul lisensi & alamat pengaduan data ditulis dari nilai ini. */}
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="edition">Paket Layanan</Label>
							<Select value={data.edition} onValueChange={(value) => setData('edition', value)}>
								<SelectTrigger id="edition">
									<SelectValue placeholder="Pilih paket layanan..." />
								</SelectTrigger>
								<SelectContent>
									{(editions ?? []).map((item) => (
										<SelectItem key={item.value} value={item.value}>
											{item.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								Menentukan klausul lisensi di halaman <b>Syarat &amp; Ketentuan</b>: sewa = hak pakai
								selama berlangganan; beli = lisensi perpetual + penyerahan kode sumber.
							</p>
							{errors.edition && <InputError message={errors.edition} />}
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="grid w-full items-center gap-1.5">
								<Label htmlFor="email_kontak">Email Kontak Resmi</Label>
								<Input
									name="email_kontak"
									id="email_kontak"
									type="email"
									value={data.email_kontak}
									onChange={onHandleChange}
									placeholder="damkar@badungkab.go.id"
								/>
								{errors.email_kontak && <InputError message={errors.email_kontak} />}
							</div>
							<div className="grid w-full items-center gap-1.5">
								<Label htmlFor="penanggung_jawab_data">Penanggung Jawab Data</Label>
								<Input
									name="penanggung_jawab_data"
									id="penanggung_jawab_data"
									value={data.penanggung_jawab_data}
									onChange={onHandleChange}
									placeholder="Kepala Bidang / pejabat yang ditunjuk"
								/>
								{errors.penanggung_jawab_data && <InputError message={errors.penanggung_jawab_data} />}
							</div>
						</div>

						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="alamat_instansi">Alamat Instansi</Label>
							<Input
								name="alamat_instansi"
								id="alamat_instansi"
								value={data.alamat_instansi}
								onChange={onHandleChange}
								placeholder="Jl. Raya Sempidi No. 1, Mengwi, Badung"
							/>
							<p className="text-xs text-muted-foreground">
								Ditampilkan di <b>Kebijakan Privasi</b> sebagai alamat pengaduan warga atas datanya.
							</p>
							{errors.alamat_instansi && <InputError message={errors.alamat_instansi} />}
						</div>

						<div className="flex items-start gap-3 rounded-md border border-border bg-accent/40 p-3">
							<IconInfoCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
							<p className="text-xs leading-relaxed text-muted-foreground">
								Data ini hanya mengatur <b>wajah publik</b> kabupaten (Spotlight, halaman "Laporan
								Diterima", pejabat, nomor darurat). Routing laporan tetap mengikuti lokasi kejadian (pin
								GPS), bukan tenant ini.
							</p>
						</div>

						<div className="flex items-center gap-2">
							<Checkbox
								id="is_active"
								name="is_active"
								checked={data.is_active}
								onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
							/>
							<Label htmlFor="is_active">Aktif</Label>
							{errors.is_active && <InputError message={errors.is_active} />}
						</div>

						<div className="flex justify-end gap-x-2">
							{!tenant && (
								<Button type="button" variant="secondary" size="sm" onClick={() => reset()}>
									Reset
								</Button>
							)}
							<Button type="submit" variant="orange" size="sm" disabled={processing}>
								Simpan
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

Form.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
