import DatePicker from '@/Components/DatePicker';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { Link, useForm } from '@inertiajs/react';
import {
	IconArrowLeft,
	IconCloudUpload,
	IconDeviceFloppy,
	IconId,
	IconLoader2,
	IconPlus,
	IconShieldCheck,
	IconTrash,
	IconUser,
	IconUsersGroup,
	IconX,
} from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const MAX_PHOTOS = 8;

export default function Create(props) {
	const report = props.report;
	const p = props.prefill || {};
	const timAtensiSuggestion = props.timAtensiSuggestion || '';

	const { data, setData, post, processing, errors, transform } = useForm({
		status: 'sementara',
		jenis_kejadian: p.jenis_kejadian ?? '',
		sumber_informasi: p.sumber_informasi ?? '',
		occurred_at: p.occurred_at ?? '',
		lokasi_alamat: p.lokasi_alamat ?? '',
		kelurahan: p.kelurahan ?? '',
		kecamatan: p.kecamatan ?? '',
		pemilik_nama: p.pemilik_nama ?? '',
		pemilik_umur: p.pemilik_umur ?? '',
		kerugian: p.kerugian ?? '',
		tim_atensi: p.tim_atensi ?? '',
		kronologi: p.kronologi ?? '',
		victims: (p.victims || []).map((v) => ({
			nama: v.nama ?? '',
			tanggal_lahir: v.tanggal_lahir ?? '',
			alamat: v.alamat ?? '',
			ktp: null,
		})),
		photos: [],
	});

	const [previews, setPreviews] = useState([]);
	const previewsRef = useRef([]);
	const fileInputPhoto = useRef(null);

	const onHandleChange = (e) => setData(e.target.name, e.target.value);

	// --- Korban (dinamis) ---
	const hasReporterData = Boolean(report.reporter_name || report.reporter_address);
	const addVictim = () =>
		setData('victims', [...data.victims, { nama: '', tanggal_lahir: '', alamat: '', ktp: null }]);
	// Tambah korban terisi data pelapor (nama & alamat dari laporan).
	const addVictimFromReporter = () =>
		setData('victims', [
			...data.victims,
			{
				nama: report.reporter_name || '',
				tanggal_lahir: '',
				alamat: report.reporter_address || '',
				ktp: null,
			},
		]);
	const removeVictim = (i) =>
		setData(
			'victims',
			data.victims.filter((_, idx) => idx !== i),
		);
	const updateVictim = (i, field, value) =>
		setData(
			'victims',
			data.victims.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)),
		);

	// Foto KTP korban ditampilkan seperti "Foto kejadian" (tile + preview). Simpan blob
	// preview di objek korban; revoke saat diganti/dihapus agar tidak bocor memori.
	const setVictimKtp = (i, file) =>
		setData(
			'victims',
			data.victims.map((v, idx) => {
				if (idx !== i) return v;
				if (v.ktpPreview) URL.revokeObjectURL(v.ktpPreview);
				return { ...v, ktp: file, ktpPreview: file ? URL.createObjectURL(file) : null };
			}),
		);

	// Waktu kejadian = tanggal (DatePicker shadcn) + jam terpisah, disimpan sebagai
	// 'YYYY-MM-DDTHH:mm' (diterima validasi `date` Laravel).
	const occurredDate = data.occurred_at ? data.occurred_at.slice(0, 10) : '';
	const occurredTime = data.occurred_at ? data.occurred_at.slice(11, 16) : '';
	const setOccurred = (datePart, timePart) => {
		const d = datePart !== undefined ? datePart : occurredDate;
		const t = timePart !== undefined ? timePart : occurredTime;
		setData('occurred_at', d ? `${d}T${t || '00:00'}` : '');
	};

	// --- Foto kejadian ---
	const handleAddPhotos = (e) => {
		const files = Array.from(e.target.files || []);
		if (!files.length) return;

		const room = MAX_PHOTOS - data.photos.length;
		const accepted = files.slice(0, Math.max(0, room));
		const combined = [...data.photos, ...accepted];
		setData('photos', combined);

		previewsRef.current.forEach((pv) => URL.revokeObjectURL(pv.url));
		const next = combined.map((f) => ({ url: URL.createObjectURL(f) }));
		previewsRef.current = next;
		setPreviews(next);

		if (fileInputPhoto.current) fileInputPhoto.current.value = '';
	};

	const removePhoto = (index) => {
		const nextPhotos = data.photos.filter((_, i) => i !== index);
		setData('photos', nextPhotos);
		if (previews[index]) URL.revokeObjectURL(previews[index].url);
		const nextPrev = previews.filter((_, i) => i !== index);
		previewsRef.current = nextPrev;
		setPreviews(nextPrev);
	};

	const submitWith = (status) => {
		transform((d) => ({ ...d, status }));
		post(route('reports.resolution.store', report.id), {
			preserveScroll: true,
			onSuccess: () => toast.success(`Berita acara (${status}) berhasil disimpan.`),
			onError: () => toast.error('Periksa kembali isian Anda.'),
		});
	};

	return (
		<div className="relative w-full pb-32">
			<div className="mx-auto flex w-full max-w-3xl flex-col space-y-6">
				<div>
					<Button
						variant="outline"
						className="h-9 rounded-md border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
						asChild
					>
						<Link href={route('reports.show', report.id)}>
							<IconArrowLeft className="mr-2 h-4 w-4" />
							Kembali ke Detail
						</Link>
					</Button>
				</div>

				<Card className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
					<CardHeader className="border-b border-border bg-transparent pb-5">
						<CardTitle className="text-lg font-semibold text-foreground">
							Laporan Kegiatan Penyelamatan
						</CardTitle>
						<CardDescription className="mt-1 text-sm text-muted-foreground">
							{report.title ? `${report.title} — ` : ''}
							Isi data kejadian. Simpan sebagai <b>sementara</b> dulu; entri <b>final</b> dibuat
							terpisah setelah investigasi.
						</CardDescription>
					</CardHeader>

					<CardContent className="p-5 sm:p-6">
						<form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<Label htmlFor="jenis_kejadian" className="text-sm font-medium text-foreground/80">
										Jenis Kejadian
									</Label>
									<Input
										name="jenis_kejadian"
										id="jenis_kejadian"
										value={data.jenis_kejadian}
										onChange={onHandleChange}
										placeholder="Contoh: kebakaran rumah bedeng"
										className="mt-1.5 h-10 rounded-md border-border bg-card focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
									/>
									<p className="mt-1 text-[12px] text-muted-foreground">
										Diambil dari judul insiden. Bisa diedit.
									</p>
									<InputError message={errors.jenis_kejadian} className="mt-1" />
								</div>

								<div>
									<Label htmlFor="sumber_informasi" className="text-sm font-medium text-foreground/80">
										Sumber Informasi
									</Label>
									<Input
										name="sumber_informasi"
										id="sumber_informasi"
										value={data.sumber_informasi}
										onChange={onHandleChange}
										placeholder="Contoh: warga menelepon pos induk"
										className="mt-1.5 h-10 rounded-md border-border bg-card focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
									/>
									<InputError message={errors.sumber_informasi} className="mt-1" />
								</div>

								<div>
									<Label htmlFor="occurred_at" className="text-sm font-medium text-foreground/80">
										Waktu Kejadian
									</Label>
									<div className="mt-1.5 flex gap-2">
										<DatePicker
											id="occurred_at"
											value={occurredDate}
											onChange={(d) => setOccurred(d, undefined)}
											placeholder="Tanggal kejadian"
											startYear={2000}
											className="flex-1"
										/>
										<Input
											type="time"
											aria-label="Pukul"
											value={occurredTime}
											onChange={(e) => setOccurred(undefined, e.target.value)}
											className="h-10 w-28 rounded-md border-border bg-card focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
										/>
									</div>
									<InputError message={errors.occurred_at} className="mt-1" />
								</div>

								<div>
									<Label htmlFor="kerugian" className="text-sm font-medium text-foreground/80">
										Estimasi Kerugian
									</Label>
									<Input
										name="kerugian"
										id="kerugian"
										value={data.kerugian}
										onChange={onHandleChange}
										placeholder="Contoh: ±1jt"
										className="mt-1.5 h-10 rounded-md border-border bg-card focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
									/>
									<InputError message={errors.kerugian} className="mt-1" />
								</div>
							</div>

							<div className="border-t border-border pt-5">
								<Label className="text-sm font-medium text-foreground/80">Lokasi Kejadian</Label>
								<div className="mt-1.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div className="sm:col-span-2">
										<Label htmlFor="lokasi_alamat" className="text-[13px] text-muted-foreground">
											Alamat
										</Label>
										<Textarea
											name="lokasi_alamat"
											id="lokasi_alamat"
											value={data.lokasi_alamat}
											onChange={onHandleChange}
											placeholder="Alamat lengkap (Jl. ... No. ..., patokan, RT/RW)"
											className="mt-1 min-h-[64px] resize-y rounded-md border-border bg-card p-3 text-sm leading-relaxed focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
										/>
										<InputError message={errors.lokasi_alamat} className="mt-1" />
									</div>
									<div>
										<Label htmlFor="kelurahan" className="text-[13px] text-muted-foreground">
											Desa/Kelurahan
										</Label>
										<Input
											name="kelurahan"
											id="kelurahan"
											value={data.kelurahan}
											onChange={onHandleChange}
											placeholder="Desa/Kelurahan"
											className="mt-1 h-10 rounded-md border-border bg-card focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
										/>
										<InputError message={errors.kelurahan} className="mt-1" />
									</div>
									<div>
										<Label htmlFor="kecamatan" className="text-[13px] text-muted-foreground">
											Kecamatan
										</Label>
										<Input
											name="kecamatan"
											id="kecamatan"
											value={data.kecamatan}
											onChange={onHandleChange}
											placeholder="Kecamatan"
											className="mt-1 h-10 rounded-md border-border bg-card focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
										/>
										<InputError message={errors.kecamatan} className="mt-1" />
									</div>
								</div>
							</div>

							<div className="border-t border-border pt-5">
								<Label className="text-sm font-medium text-foreground/80">Pemilik Lahan/Rumah</Label>
								<div className="mt-1.5 grid grid-cols-1 gap-4 sm:grid-cols-3">
									<div className="sm:col-span-2">
										<Input
											name="pemilik_nama"
											value={data.pemilik_nama}
											onChange={onHandleChange}
											placeholder="Nama pemilik"
											className="h-10 rounded-md border-border bg-card focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
										/>
										<InputError message={errors.pemilik_nama} className="mt-1" />
									</div>
									<div>
										<Input
											type="number"
											name="pemilik_umur"
											value={data.pemilik_umur}
											onChange={onHandleChange}
											placeholder="Umur"
											min="0"
											className="h-10 rounded-md border-border bg-card focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
										/>
										<InputError message={errors.pemilik_umur} className="mt-1" />
									</div>
								</div>
							</div>

							<div className="border-t border-border pt-5">
								<div className="flex items-center justify-between gap-2">
									<Label htmlFor="tim_atensi" className="text-sm font-medium text-foreground/80">
										Tim yang Atensi di TKP
									</Label>
									{timAtensiSuggestion && (
										<Button
											type="button"
											variant="outline"
											onClick={() => setData('tim_atensi', timAtensiSuggestion)}
											className="h-8 gap-1 rounded-md border-border bg-card px-3 text-xs font-semibold shadow-sm"
										>
											<IconUsersGroup className="h-3.5 w-3.5" /> Isi dari data sistem
										</Button>
									)}
								</div>
								<Textarea
									name="tim_atensi"
									id="tim_atensi"
									value={data.tim_atensi}
									onChange={onHandleChange}
									placeholder="Contoh: Pemadam Pos Cokro, BW 13, BW 16..."
									className="mt-1.5 min-h-[72px] resize-y rounded-md border-border bg-card p-3 text-sm focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
								/>
								<p className="mt-1 text-[12px] text-muted-foreground">
									Terisi otomatis dari data sistem (armada, petugas, dan relawan yang tercatat menangani
									insiden). Bisa diedit.
								</p>
								<InputError message={errors.tim_atensi} className="mt-1" />
							</div>

							<div>
								<Label htmlFor="kronologi" className="text-sm font-medium text-foreground/80">
									Kronologi / Keterangan
								</Label>
								<Textarea
									name="kronologi"
									id="kronologi"
									value={data.kronologi}
									onChange={onHandleChange}
									placeholder="Uraian singkat penanganan (mis. dipadamkan pemilik & tukang, nihil penyemprotan)..."
									className="mt-1.5 min-h-[90px] resize-y rounded-md border-border bg-card p-3 text-sm focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
								/>
								<InputError message={errors.kronologi} className="mt-1" />
							</div>

							{/* --- Korban (dinamis) --- */}
							<div className="border-t border-border pt-5">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<Label className="text-sm font-medium text-foreground/80">
										Identitas Korban ({data.victims.length})
									</Label>
									<div className="flex flex-wrap gap-2">
										{hasReporterData && (
											<Button
												type="button"
												variant="outline"
												onClick={addVictimFromReporter}
												className="h-8 gap-1 rounded-md border-border bg-card px-3 text-xs font-semibold shadow-sm"
											>
												<IconUser className="h-3.5 w-3.5" /> Ambil dari data pelapor
											</Button>
										)}
										<Button
											type="button"
											variant="outline"
											onClick={addVictim}
											className="h-8 gap-1 rounded-md border-border bg-card px-3 text-xs font-semibold shadow-sm"
										>
											<IconPlus className="h-3.5 w-3.5" /> Tambah korban
										</Button>
									</div>
								</div>
								<p className="mt-1 text-[12px] text-muted-foreground">
									Kosongkan jika tidak ada korban. Foto KTP disimpan aman (hanya petugas yang bisa
									membuka).
								</p>

								<div className="mt-3 space-y-3">
									{data.victims.map((v, i) => (
										<div key={i} className="rounded-lg border border-border bg-muted/40 p-3">
											<div className="flex items-center justify-between">
												<span className="text-xs font-bold text-muted-foreground">Korban {i + 1}</span>
												<button
													type="button"
													onClick={() => removeVictim(i)}
													className="text-muted-foreground transition-colors hover:text-destructive"
													aria-label="Hapus korban"
												>
													<IconTrash className="h-4 w-4" />
												</button>
											</div>
											<div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
												<Input
													value={v.nama}
													onChange={(e) => updateVictim(i, 'nama', e.target.value)}
													placeholder="Nama korban"
													className="h-10 rounded-md border-border bg-card focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
												/>
												<DatePicker
													value={v.tanggal_lahir}
													onChange={(d) => updateVictim(i, 'tanggal_lahir', d)}
													placeholder="Tanggal lahir"
													startYear={1920}
												/>
												<Input
													value={v.alamat}
													onChange={(e) => updateVictim(i, 'alamat', e.target.value)}
													placeholder="Alamat korban"
													className="h-10 rounded-md border-border bg-card focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive sm:col-span-2"
												/>
											</div>
											<div className="mt-3">
												<Label className="text-[12px] font-medium text-muted-foreground">
													Foto KTP <span className="font-normal">(opsional)</span>
												</Label>
												<div className="mt-1.5 grid grid-cols-3 gap-3 sm:grid-cols-4">
													{v.ktpPreview ? (
														<div className="group relative h-24 w-full overflow-hidden rounded-md border border-border shadow-sm">
															<img
																src={v.ktpPreview}
																alt="Foto KTP korban"
																className="h-full w-full object-cover"
															/>
															<button
																type="button"
																onClick={() => setVictimKtp(i, null)}
																className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md border border-transparent bg-card/90 text-destructive shadow-sm backdrop-blur-sm transition-colors hover:border-destructive/30 hover:bg-destructive/10"
																title="Hapus foto KTP"
															>
																<IconX stroke={2.5} className="h-3.5 w-3.5" />
															</button>
														</div>
													) : (
														<label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/50 text-center text-muted-foreground transition-colors hover:bg-muted">
															<IconId className="mb-1 h-5 w-5" stroke={1.5} />
															<span className="text-[11px] font-semibold">Foto KTP</span>
															<input
																type="file"
																accept="image/*"
																onChange={(e) => setVictimKtp(i, e.target.files?.[0] || null)}
																className="sr-only"
															/>
														</label>
													)}
												</div>
												<InputError message={errors[`victims.${i}.ktp`]} className="mt-1" />
											</div>
										</div>
									))}
								</div>
							</div>

							{/* --- Foto kejadian --- */}
							<div className="border-t border-border pt-5">
								<Label className="text-sm font-medium text-foreground/80">
									Foto Kejadian ({data.photos.length}/{MAX_PHOTOS})
								</Label>
								<input
									type="file"
									accept="image/*"
									multiple
									ref={fileInputPhoto}
									onChange={handleAddPhotos}
									className="sr-only"
								/>
								<div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
									{previews.map((pv, i) => (
										<div
											key={`ph-${i}`}
											className="group relative h-32 w-full overflow-hidden rounded-md border border-border shadow-sm"
										>
											<img src={pv.url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
											<button
												type="button"
												onClick={() => removePhoto(i)}
												className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md border border-transparent bg-card/90 text-destructive shadow-sm backdrop-blur-sm transition-colors hover:border-destructive/30 hover:bg-destructive/10"
												title="Hapus foto"
											>
												<IconX stroke={2.5} className="h-4 w-4" />
											</button>
										</div>
									))}
									{data.photos.length < MAX_PHOTOS && (
										<button
											type="button"
											onClick={() => fileInputPhoto.current?.click()}
											className="flex h-32 w-full flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/50 text-center text-muted-foreground transition-colors hover:bg-muted"
										>
											<IconCloudUpload className="mb-1 h-6 w-6" stroke={1.5} />
											<span className="text-xs font-semibold">Tambah foto</span>
										</button>
									)}
								</div>
								<InputError message={errors.photos} className="mt-1" />
							</div>

							{/* --- Aksi simpan --- */}
							<div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
								<Button
									type="button"
									onClick={() => submitWith('sementara')}
									disabled={processing}
									className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-warning px-6 text-sm font-semibold text-warning-foreground transition-colors hover:bg-warning/90 disabled:opacity-70"
								>
									{processing ? (
										<IconLoader2 className="h-5 w-5 animate-spin" />
									) : (
										<IconDeviceFloppy className="h-5 w-5" />
									)}
									Simpan sebagai Sementara
								</Button>
								<Button
									type="button"
									onClick={() => submitWith('final')}
									disabled={processing}
									className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-success px-6 text-sm font-semibold text-success-foreground transition-colors hover:bg-success/90 disabled:opacity-70"
								>
									{processing ? (
										<IconLoader2 className="h-5 w-5 animate-spin" />
									) : (
										<IconShieldCheck className="h-5 w-5" />
									)}
									Simpan sebagai Final
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

Create.layout = (page) => <AppLayout children={page} title="Laporan Kegiatan Penyelamatan" />;
