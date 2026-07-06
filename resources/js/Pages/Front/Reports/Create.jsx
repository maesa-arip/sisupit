import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import UserLeafletMap from '@/Components/UserLeafletMap';
import AppLayout from '@/Layouts/AppLayout';
import { DEFAULT_MAP_CENTER, flashMessage, GEO_ACCURACY_THRESHOLD, getFreshPosition } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import {
	IconAlertTriangle,
	IconArrowLeft,
	IconCloudUpload,
	IconLoader2,
	IconMapPinFilled,
	IconSend,
	IconX,
} from '@tabler/icons-react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Helper: Algoritma Pencocokan "Sapu Jagat" (Omni-Search)
const matchRegionName = (dbList, osmNamesArray, removeWords = []) => {
	if (!osmNamesArray || osmNamesArray.length === 0 || !dbList || dbList.length === 0) return null;

	const cleanOsmNames = osmNamesArray
		.map((name) => {
			let clean = name.toLowerCase();
			removeWords.forEach((w) => {
				clean = clean.replace(new RegExp(`\\b${w}\\b`, 'gi'), '');
			});
			return clean.replace(/[^\w\s]/gi, '').trim();
		})
		.filter((n) => n.length > 0);

	let matched = dbList.find((dbItem) => {
		let itemName = dbItem.name.toLowerCase();
		removeWords.forEach((w) => {
			itemName = itemName.replace(new RegExp(`\\b${w}\\b`, 'gi'), '');
		});
		itemName = itemName.replace(/[^\w\s]/gi, '').trim();
		return cleanOsmNames.includes(itemName);
	});

	if (!matched) {
		matched = dbList.find((dbItem) => {
			let itemName = dbItem.name.toLowerCase();
			removeWords.forEach((w) => {
				itemName = itemName.replace(new RegExp(`\\b${w}\\b`, 'gi'), '');
			});
			itemName = itemName.replace(/[^\w\s]/gi, '').trim();
			return cleanOsmNames.some((osmName) => itemName.includes(osmName) || osmName.includes(itemName));
		});
	}

	return matched;
};

export default function Create(props) {
	const auth = props.auth.user;

	// Pastikan Controller mengirim data 'provinces' agar sistem bisa memulai pencocokan
	const provinces = props.provinces || [];

	const [userLocation, setUserLocation] = useState(null);
	const [locationLoading, setLocationLoading] = useState(true);
	const [friendlyAddress, setFriendlyAddress] = useState('');

	const [previews, setPreviews] = useState([]); // galeri foto (FINDINGS #17)
	const previewsRef = useRef([]);
	const fileInputPhoto = useRef(null);

	const { data, setData, post, processing, errors } = useForm({
		name: auth?.name || '',
		address: '',
		title: '',
		description: '',
		lat: '',
		lng: '',
		province_code: '',
		city_code: '',
		district_code: '',
		village_code: '',
		road: '',
		phone: auth?.phone || '',
		photos: [],
		_method: props.page_settings.method,
	});

	const fallbackLocation = (latitude, longitude) => {
		setFriendlyAddress('Titik GPS terdeteksi (Mode Darurat)');
		setData((prevData) => ({
			...prevData,
			lat: latitude,
			lng: longitude,
		}));
	};

	// Titik dipakai tapi yurisdiksi TIDAK di-auto-isi (fix tak akurat / gagal deteksi).
	// User wajib menggeser pin merah ke titik kejadian agar wilayah terisi dari titik benar.
	const applyUntrustedPoint = (latitude, longitude, message) => {
		setFriendlyAddress(message);
		setData((prevData) => ({
			...prevData,
			lat: latitude,
			lng: longitude,
			// Kosongkan yurisdiksi: jangan percaya wilayah dari fix yang tidak akurat.
			province_code: '',
			city_code: '',
			district_code: '',
			village_code: '',
			road: '',
		}));
	};

	// Reverse-geocode sebuah titik lalu auto-isi alamat & yurisdiksi (provinsi..desa).
	// Dipakai baik oleh deteksi GPS awal maupun saat pin peta digeser manual.
	const resolveLocation = async (latitude, longitude) => {
		setUserLocation({ latitude, longitude });

		try {
			// 1. Ambil Data Reverse Geocoding lewat proxy backend (lihat GeocodeController)
			const response = await axios.get(route('api.geocode.reverse'), {
				params: { lat: latitude, lng: longitude },
			});

			const addr = response.data.address;

			if (addr) {
				// Siapkan Alamat Ramah Manusia untuk UI
				const roadName = addr.road || addr.street || addr.pedestrian || '';
				const villageName = addr.village || addr.suburb || addr.town || '';
				const districtName = addr.city_district || addr.district || '';
				const displayAddr = [roadName, villageName, districtName].filter(Boolean).join(', ');

				setFriendlyAddress(displayAddr || response.data.display_name?.split(',')[0] || 'Lokasi terdeteksi');

				// 2. AUTO-FILL YURISDIKSI (OMNI-SEARCH GAIB)
				let pCode = '',
					cCode = '',
					dCode = '',
					vCode = '';

				const rawOsmNames = [
					addr.state,
					addr.region,
					addr.city,
					addr.county,
					addr.regency,
					addr.town,
					addr.city_district,
					addr.municipality,
					addr.district,
					addr.suburb,
					addr.village,
					addr.neighbourhood,
					addr.hamlet,
				];
				const osmNames = rawOsmNames.filter((n) => n && !n.toLowerCase().includes('no name'));
				const removeWords = [
					'provinsi',
					'prov',
					'kota',
					'kabupaten',
					'kab',
					'kecamatan',
					'kec',
					'kelurahan',
					'desa',
				];

				// Level 1: Provinsi
				if (osmNames.length > 0 && provinces.length > 0) {
					const matchedProv = matchRegionName(provinces, osmNames, removeWords);
					if (matchedProv) pCode = matchedProv.code;
				}

				// Level 2: Kota
				if (pCode) {
					const resCity = await axios.get(`/api/regions/cities/${pCode}`);
					const matchedCity = matchRegionName(resCity.data, osmNames, removeWords);
					if (matchedCity) cCode = matchedCity.code;
				}

				// Level 3: Kecamatan
				if (cCode) {
					const resDist = await axios.get(`/api/regions/districts/${cCode}`);
					const matchedDist = matchRegionName(resDist.data, osmNames, removeWords);
					if (matchedDist) dCode = matchedDist.code;
				}

				// Level 4: Desa
				if (dCode) {
					const resVill = await axios.get(`/api/regions/villages/${dCode}`);
					const matchedVill = matchRegionName(resVill.data, osmNames, removeWords);
					if (matchedVill) vCode = matchedVill.code;
				}

				// 3. Simpan semua kode ke State Formulir
				setData((prevData) => ({
					...prevData,
					lat: latitude,
					lng: longitude,
					province_code: pCode,
					city_code: cCode,
					district_code: dCode,
					village_code: vCode,
					road: roadName,
				}));
			} else {
				fallbackLocation(latitude, longitude);
			}
		} catch (error) {
			console.error('Gagal mengambil data wilayah:', error);
			fallbackLocation(latitude, longitude);
		} finally {
			setLocationLoading(false);
		}
	};

	// AUTO DETECT LOKASI & YURISDIKSI SILENTLY.
	// Alur: fix akurat & segar dulu (getFreshPosition, fallback ke lokasi jaringan sekali).
	// Fix dengan akurasi buruk (> GEO_ACCURACY_THRESHOLD) TIDAK dipercaya untuk auto-isi
	// wilayah — mencegah gejala "lokasi lari ke kota lain" akibat lokasi berbasis IP/WiFi.
	const getUserLocation = () => {
		if (!navigator.geolocation) {
			toast.error('Browser Anda tidak mendukung deteksi lokasi.');
			setLocationLoading(false);
			return;
		}

		setLocationLoading(true);
		getFreshPosition()
			.then(({ coords }) => {
				setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });

				if (coords.accuracy != null && coords.accuracy > GEO_ACCURACY_THRESHOLD) {
					// Kemungkinan fix jaringan/IP (bisa meleset puluhan km): pakai titiknya
					// sebagai awalan pin, tapi minta user mengoreksi lewat geser pin.
					applyUntrustedPoint(
						coords.latitude,
						coords.longitude,
						'Lokasi kurang akurat — geser pin merah tepat ke titik kejadian.',
					);
					setLocationLoading(false);
					toast.warning('Lokasi kurang akurat. Geser pin merah di peta tepat ke titik kejadian.');
					return;
				}

				resolveLocation(coords.latitude, coords.longitude);
			})
			.catch((error) => {
				console.error('Error getting user location:', error);
				// Gagal total: taruh pin di pusat peta agar user tetap bisa menandai manual.
				setUserLocation(null);
				applyUntrustedPoint(
					DEFAULT_MAP_CENTER.lat,
					DEFAULT_MAP_CENTER.lng,
					'Lokasi tak terdeteksi — geser pin merah ke titik kejadian.',
				);
				setLocationLoading(false);
				toast.error('Gagal melacak lokasi. Pastikan izin/GPS aktif, lalu geser pin merah & isi patokan.');
			});
	};

	// Dipanggil saat pin peta digeser manual -> koreksi titik + isi ulang yurisdiksi.
	const handleMarkerDrag = (latitude, longitude) => {
		setLocationLoading(true);
		resolveLocation(latitude, longitude);
	};

	useEffect(() => {
		getUserLocation();

		return () => {
			previewsRef.current.forEach((p) => URL.revokeObjectURL(p.url));
		};
	}, []);

	const onHandleChange = (e) => setData(e.target.name, e.target.value);

	const MAX_PHOTOS = 6;

	const handlePhotosChange = (e) => {
		const files = Array.from(e.target.files || []);
		if (!files.length) return;

		const combined = [...data.photos, ...files].slice(0, MAX_PHOTOS);
		setData('photos', combined);

		// Buat ulang object URL untuk seluruh set (revoke yang lama agar tak bocor).
		previewsRef.current.forEach((p) => URL.revokeObjectURL(p.url));
		const nextPreviews = combined.map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
		previewsRef.current = nextPreviews;
		setPreviews(nextPreviews);

		if (fileInputPhoto.current) fileInputPhoto.current.value = '';
	};

	const removePhoto = (index) => {
		const nextPhotos = data.photos.filter((_, i) => i !== index);
		setData('photos', nextPhotos);

		if (previews[index]) URL.revokeObjectURL(previews[index].url);
		const nextPreviews = previews.filter((_, i) => i !== index);
		previewsRef.current = nextPreviews;
		setPreviews(nextPreviews);
	};

	const onHandleSubmit = (e) => {
		e.preventDefault();

		if (!data.lat || !data.lng) {
			toast.warning('Lokasi belum terisi. Geser pin merah di peta ke titik kejadian.');
			return;
		}

		// Saat membuat laporan wilayah wajib terisi (server memvalidasi provinsi..desa).
		// Jika kosong berarti titik belum dikenali (fix tak akurat / gagal) — minta koreksi
		// pin lebih dulu daripada gagal validasi dengan pesan field tersembunyi.
		if (data._method === 'POST' && !data.province_code) {
			toast.warning(
				'Wilayah belum terkenali. Geser pin merah tepat ke titik kejadian agar wilayah terisi otomatis.',
			);
			return;
		}

		post(props.page_settings.action, {
			preserveScroll: true,
			preserveState: true,
			onSuccess: (success) => {
				const flash = flashMessage(success);
				if (flash) toast[flash.type](flash.message);
			},
		});
	};

	return (
		<div className="relative w-full pb-32">
			<div className="mx-auto flex w-full max-w-3xl flex-col space-y-6">
				{/* Header Section */}
				<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
					<Button
						variant="outline"
						className="h-9 rounded-md border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
						asChild
					>
						<Link href={route('dashboard')}>
							<IconArrowLeft className="mr-2 h-4 w-4" />
							Batal
						</Link>
					</Button>
				</div>

				{/* Form Card */}
				<Card className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
					<CardHeader className="border-b border-border bg-transparent pb-5">
						<CardTitle className="text-lg font-semibold text-foreground">Kirim Laporan Darurat</CardTitle>
						<CardDescription className="mt-1 text-sm text-muted-foreground">
							Mohon lengkapi formulir di bawah agar relawan dapat segera membantu Anda.
						</CardDescription>
					</CardHeader>

					<CardContent className="p-5 sm:p-6">
						<form className="space-y-6" onSubmit={onHandleSubmit}>
							{/* --- BAGIAN LOKASI --- */}
							<div className="space-y-3">
								{/* Header Lokasi & Status Digabung */}
								<div className="flex items-center gap-3 border-b border-border pb-1">
									{locationLoading ? (
										<div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-info/10 dark:text-info">
											<IconLoader2 className="h-4 w-4 animate-spin" />
										</div>
									) : userLocation ? (
										<div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-green-50 text-green-600 dark:bg-success/10 dark:text-success">
											<IconMapPinFilled className="h-4 w-4" />
										</div>
									) : (
										<div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10 text-destructive">
											<IconAlertTriangle className="h-4 w-4" />
										</div>
									)}

									<div className="min-w-0 flex-1 pb-2">
										<p className="text-sm font-semibold uppercase tracking-wide text-foreground">
											{locationLoading
												? 'Memindai Koordinat...'
												: userLocation
													? 'Lokasi Terdeteksi'
													: 'GPS Tidak Aktif'}
										</p>
										{friendlyAddress && !locationLoading && (
											<p className="mt-0.5 truncate text-[13px] text-muted-foreground">
												{friendlyAddress}
											</p>
										)}
									</div>
								</div>

								{/* Peta - pin bisa digeser untuk mengoreksi titik lokasi */}
								<div className="relative z-0 h-[200px] w-full overflow-hidden rounded-md border border-border bg-muted shadow-inner sm:h-[250px]">
									<UserLeafletMap
										lat={data.lat}
										lng={data.lng}
										draggable
										autoLocate={false}
										onLocationChange={handleMarkerDrag}
									/>
								</div>
								<p className="mt-1.5 text-xs text-muted-foreground">
									Titik kurang tepat? Geser pin merah di peta untuk mengoreksi lokasi.
								</p>

								{/* Patokan Manual */}
								<div className="pt-2">
									<Label htmlFor="address" className="text-sm font-medium text-foreground/80">
										Detail Patokan Lokasi
									</Label>
									<Input
										name="address"
										id="address"
										value={data.address}
										onChange={onHandleChange}
										className="mt-1.5 h-10 rounded-md border-border bg-card focus-visible:ring-1 focus-visible:ring-destructive"
										placeholder="Contoh: Samping warung cat biru, gang buntu..."
									/>
									{errors.address && <InputError message={errors.address} className="mt-1" />}
								</div>

								{/* Data Administratif (DISEMBUNYIKAN SEPENUHNYA DARI USER) */}
								<input type="hidden" name="lat" value={data.lat} />
								<input type="hidden" name="lng" value={data.lng} />
								<input type="hidden" name="province_code" value={data.province_code} />
								<input type="hidden" name="city_code" value={data.city_code} />
								<input type="hidden" name="district_code" value={data.district_code} />
								<input type="hidden" name="village_code" value={data.village_code} />
								<input type="hidden" name="road" value={data.road} />
							</div>

							{/* --- BAGIAN FORM INFORMASI --- */}
							<div className="space-y-4 pt-2">
								<h3 className="border-b border-border pb-2 text-xs font-semibold uppercase tracking-wider text-foreground">
									Informasi Laporan
								</h3>

								<div>
									<Label htmlFor="title" className="text-sm font-medium text-foreground/80">
										Apa yang terjadi?
									</Label>
									<Input
										name="title"
										id="title"
										value={data.title}
										type="text"
										placeholder="Contoh: Kebakaran Rumah, Pohon Tumbang..."
										onChange={onHandleChange}
										className="mt-1.5 h-10 rounded-md border-border bg-card focus-visible:ring-1 focus-visible:ring-destructive"
									/>
									{errors.title && <InputError message={errors.title} className="mt-1" />}
								</div>

								<div>
									<Label htmlFor="description" className="text-sm font-medium text-foreground/80">
										Detail Kejadian{' '}
										<span className="font-normal text-muted-foreground">(Opsional)</span>
									</Label>
									<Textarea
										name="description"
										id="description"
										value={data.description}
										placeholder="Jelaskan detail situasi saat ini jika memungkinkan..."
										onChange={onHandleChange}
										className="mt-1.5 min-h-[100px] resize-y rounded-md border-border bg-card p-3 text-sm focus-visible:ring-1 focus-visible:ring-destructive"
									/>
									{errors.description && <InputError message={errors.description} className="mt-1" />}
								</div>

								{/* --- BAGIAN UPLOAD FOTO --- */}
								<div className="pt-2">
									<div className="mb-3">
										<Label className="text-sm font-medium text-foreground/80">
											Foto Bukti Kejadian
										</Label>
										<p className="mt-0.5 text-[13px] text-muted-foreground">
											Sertakan satu atau beberapa foto (maks. {MAX_PHOTOS}) agar relawan dapat
											menilai skala prioritas.
										</p>
									</div>

									{/* Satu input file tersembunyi, dipakai upload box & tombol "Tambah" */}
									<input
										name="photos"
										id="photos"
										type="file"
										accept="image/*"
										multiple
										ref={fileInputPhoto}
										onChange={handlePhotosChange}
										className="sr-only"
									/>

									{previews.length > 0 ? (
										<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
											{previews.map((p, i) => (
												<div
													key={i}
													className="group relative h-32 w-full overflow-hidden rounded-md border border-border shadow-sm"
												>
													<img
														src={p.url}
														alt={`Preview ${i + 1}`}
														className="h-full w-full object-cover"
													/>
													<button
														type="button"
														onClick={() => removePhoto(i)}
														className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md border border-transparent bg-card/90 text-red-600 shadow-sm backdrop-blur-sm transition-colors hover:border-red-200 hover:bg-red-50 dark:text-destructive dark:hover:border-destructive/30 dark:hover:bg-destructive/10"
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
									) : (
										<div
											onClick={() => fileInputPhoto.current?.click()}
											className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/50 p-8 text-center transition-colors hover:bg-muted"
										>
											<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-border bg-card shadow-sm">
												<IconCloudUpload
													className="h-6 w-6 text-muted-foreground"
													stroke={1.5}
												/>
											</div>
											<p className="text-sm font-semibold text-foreground">Pilih foto kejadian</p>
											<p className="mb-5 mt-1 text-[13px] text-muted-foreground">
												Format PNG/JPG/WEBP (Maks. 4MB / foto)
											</p>
											<span className="inline-flex h-9 items-center justify-center rounded-md bg-destructive px-5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90">
												Jelajahi File
											</span>
										</div>
									)}
									{errors.photos && <InputError message={errors.photos} className="mt-1" />}
								</div>
							</div>

							{/* --- ACTIONS --- */}
							<div className="mt-5 border-t border-border pt-5">
								<Button
									type="submit"
									className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-destructive px-8 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50 disabled:cursor-not-allowed disabled:opacity-70"
									disabled={processing || locationLoading}
								>
									{processing ? (
										<IconLoader2 className="h-5 w-5 animate-spin" />
									) : (
										<IconSend className="h-5 w-5" />
									)}
									Kirim Laporan
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

Create.layout = (page) => <AppLayout children={page} title="Buat Laporan Baru" />;
