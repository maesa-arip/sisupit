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
import { Head, Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconDeviceFloppy, IconHomeCog } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const JENIS_LABELS = { dinas: 'Banjar Dinas', adat: 'Banjar Adat' };

/** Nilai sentinel untuk "belum dipilah" — Select Radix tak menerima value string kosong. */
const JENIS_KOSONG = 'belum';

/**
 * Tambah/ubah satu banjar. SATU komponen untuk create & edit (pola `Admin/Tenants/Form.jsx`):
 * isiannya sedikit dan identik, sehingga dua berkas hanya akan jadi dua tempat yang harus
 * dijaga sinkron.
 *
 * Untuk memuat daftar sungguhan (Denpasar ±400 banjar) pakai
 * `php artisan sisupit:import-banjar berkas.csv` — form ini untuk koreksi & tambahan susulan.
 */
export default function Form({ banjar = null, districts = [], jenis_options = [], admin_level }) {
	const isEdit = Boolean(banjar?.id);
	const [villages, setVillages] = useState([]);

	const { data, setData, post, put, processing, errors } = useForm({
		name: banjar?.name || '',
		code: banjar?.code || '',
		jenis: banjar?.jenis || '',
		description: banjar?.description || '',
		is_active: banjar?.is_active ?? true,
		district_code: banjar?.district_code || admin_level?.district_code || '',
		village_code: banjar?.village_code || admin_level?.village_code || '',
	});

	// Desa dimuat mengikuti kecamatan terpilih — pola yang sama dengan form fasilitas.
	useEffect(() => {
		if (!data.district_code || admin_level?.village_code) return;

		fetch(`/api/regions/villages/${data.district_code}`)
			.then((res) => res.json())
			.then(setVillages);
	}, [data.district_code]);

	const onSubmit = (e) => {
		e.preventDefault();

		const options = {
			preserveScroll: true,
			onSuccess: (success) => {
				const flash = flashMessage(success);
				if (flash) toast[flash.type](flash.message);
			},
		};

		if (isEdit) {
			put(route('admin.banjars.update', banjar.id), options);
		} else {
			post(route('admin.banjars.store'), options);
		}
	};

	return (
		<div className="flex w-full flex-col space-y-6 pb-24">
			<Head title={isEdit ? 'Perbarui Banjar' : 'Tambah Banjar'} />

			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title={isEdit ? 'Perbarui Banjar' : 'Tambah Banjar'}
					subtitle="Banjar menempel pada satu desa/kelurahan dan dipakai warga saat melengkapi profil."
					icon={IconHomeCog}
				/>
				<Button variant="outline" size="sm" asChild>
					<Link href={route('admin.banjars.index')}>
						<IconArrowLeft className="mr-1.5 h-4 w-4" /> Kembali
					</Link>
				</Button>
			</div>

			<Card>
				<CardContent className="p-5 sm:p-6">
					<form onSubmit={onSubmit} className="flex flex-col gap-5">
						<div className="grid gap-1.5">
							<Label htmlFor="name">Nama Banjar</Label>
							<Input
								id="name"
								name="name"
								value={data.name}
								onChange={(e) => setData('name', e.target.value)}
								placeholder="mis. Banjar Tegal Agung"
							/>
							<InputError message={errors.name} />
						</div>

						<div className="grid gap-5 sm:grid-cols-2">
							<div className="grid gap-1.5">
								<Label>Kecamatan</Label>
								<Combobox
									items={districts}
									value={data.district_code}
									disabled={Boolean(admin_level?.district_code)}
									onChange={(val) =>
										setData((prev) => ({ ...prev, district_code: val, village_code: '' }))
									}
									placeholder="Pilih Kecamatan..."
								/>
								<InputError message={errors.district_code} />
							</div>

							<div className="grid gap-1.5">
								<Label>Kelurahan / Desa</Label>
								<Combobox
									items={villages}
									value={data.village_code}
									disabled={!data.district_code}
									onChange={(val) => setData('village_code', val)}
									placeholder="Pilih Desa/Kelurahan..."
								/>
								<InputError message={errors.village_code} />
							</div>
						</div>

						<div className="grid gap-5 sm:grid-cols-2">
							<div className="grid gap-1.5">
								<Label>Jenis</Label>
								<Select
									value={data.jenis || JENIS_KOSONG}
									onValueChange={(val) => setData('jenis', val === JENIS_KOSONG ? '' : val)}
								>
									<SelectTrigger>
										<SelectValue>
											{data.jenis ? JENIS_LABELS[data.jenis] : 'Belum dipilah'}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{/* "Belum dipilah" bukan sekadar kolom kosong: daftar dari Pemkot/MDA
										    sering belum memisahkan dinas & adat, dan menebaknya lebih berbahaya
										    daripada mengakui belum tahu. */}
										<SelectItem value={JENIS_KOSONG}>Belum dipilah</SelectItem>
										{jenis_options.map((jenis) => (
											<SelectItem key={jenis} value={jenis}>
												{JENIS_LABELS[jenis] ?? jenis}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<InputError message={errors.jenis} />
							</div>

							<div className="grid gap-1.5">
								<Label htmlFor="code">Kode (opsional)</Label>
								<Input
									id="code"
									name="code"
									value={data.code}
									onChange={(e) => setData('code', e.target.value)}
									placeholder="Kode resmi bila ada (mis. kode SLS BPS)"
								/>
								<InputError message={errors.code} />
							</div>
						</div>

						<div className="grid gap-1.5">
							<Label htmlFor="description">Keterangan (opsional)</Label>
							<Textarea
								id="description"
								name="description"
								value={data.description}
								onChange={(e) => setData('description', e.target.value)}
								placeholder="Catatan singkat, mis. cakupan wilayah atau nama kelian."
							/>
							<InputError message={errors.description} />
						</div>

						<label className="flex w-fit items-center gap-2 text-sm font-medium">
							<input
								type="checkbox"
								className="h-4 w-4 rounded border-input"
								checked={data.is_active}
								onChange={(e) => setData('is_active', e.target.checked)}
							/>
							Aktif (muncul di pilihan warga & form hydrant warga)
						</label>

						<div className="flex justify-end gap-2 border-t border-border pt-5">
							<Button type="button" variant="ghost" asChild>
								<Link href={route('admin.banjars.index')}>Batal</Link>
							</Button>
							<Button type="submit" disabled={processing}>
								<IconDeviceFloppy className="mr-1.5 h-4 w-4" />
								{isEdit ? 'Simpan Perubahan' : 'Tambah Banjar'}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
Form.layout = (page) => <AppLayout children={page} title="Manajemen Banjar" />;
