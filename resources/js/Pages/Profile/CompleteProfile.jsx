import BanjarField from '@/Components/BanjarField';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Combobox } from '@/Components/ui/combobox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AppLayout from '@/Layouts/AppLayout';
import { GEO_OPTIONS } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { IconLoader2, IconMapPin, IconShieldCheck } from '@tabler/icons-react';
import axios from 'axios';
import { useEffect, useState } from 'react';

// Helper: Algoritma Pencocokan "Sapu Jagat" (Omni-Search) - sama seperti Front/Reports/Create.jsx
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

export default function CompleteProfile({ provinces, user, banjar_required = false }) {
	const { data, setData, post, processing, errors } = useForm({
		phone: user?.phone || '',
		province_code: '',
		city_code: '',
		district_code: '',
		village_code: '',
		banjar_id: '',
	});

	const [cities, setCities] = useState([]);
	const [districts, setDistricts] = useState([]);
	const [villages, setVillages] = useState([]);
	const [isDetecting, setIsDetecting] = useState(true);
	const [detectedRegion, setDetectedRegion] = useState('');

	useEffect(() => {
		if (data.province_code) {
			axios.get(`/api/regions/cities/${data.province_code}`).then((res) => setCities(res.data));
		}
	}, [data.province_code]);

	useEffect(() => {
		if (data.city_code) {
			axios.get(`/api/regions/districts/${data.city_code}`).then((res) => setDistricts(res.data));
		}
	}, [data.city_code]);

	useEffect(() => {
		if (data.district_code) {
			axios.get(`/api/regions/villages/${data.district_code}`).then((res) => setVillages(res.data));
		}
	}, [data.district_code]);

	useEffect(() => {
		if (!navigator.geolocation) {
			setIsDetecting(false);
			return;
		}

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const { latitude, longitude } = position.coords;
				try {
					const res = await axios.get(route('api.geocode.reverse'), {
						params: { lat: latitude, lng: longitude },
					});
					const addr = res.data?.address;

					if (addr) {
						const osmNames = [
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
						].filter((n) => n && !n.toLowerCase().includes('no name'));
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

						let pCode = '',
							cCode = '',
							dCode = '',
							vCode = '';

						let matchedCity = null,
							matchedDist = null,
							matchedVill = null;

						const matchedProv = matchRegionName(provinces, osmNames, removeWords);
						if (matchedProv) pCode = matchedProv.code;

						if (pCode) {
							const resCity = await axios.get(`/api/regions/cities/${pCode}`);
							setCities(resCity.data);
							matchedCity = matchRegionName(resCity.data, osmNames, removeWords);
							if (matchedCity) cCode = matchedCity.code;
						}

						if (cCode) {
							const resDist = await axios.get(`/api/regions/districts/${cCode}`);
							setDistricts(resDist.data);
							matchedDist = matchRegionName(resDist.data, osmNames, removeWords);
							if (matchedDist) dCode = matchedDist.code;
						}

						if (dCode) {
							const resVill = await axios.get(`/api/regions/villages/${dCode}`);
							setVillages(resVill.data);
							matchedVill = matchRegionName(resVill.data, osmNames, removeWords);
							if (matchedVill) vCode = matchedVill.code;
						}

						// Kalimat konfirmasi di bawah bicara soal WILAYAH, jadi isinya nama wilayah yang
						// benar-benar cocok dengan tabel `indonesia_*` — BUKAN `display_name` mentah dari
						// Nominatim. `display_name` selalu diawali POI terdekat apa adanya dari tag `name`
						// OSM, yang di koridor wisata Kuta–Pemogan kerap beraksara non-Latin (Rusia, Jepang,
						// Korea). `accept-language=id` tidak menolong: parameter itu hanya memilih di antara
						// varian `name:<lang>`, tak pernah menyentuh tag `name` utama. Lihat FINDINGS #83.
						// Efek sampingnya disengaja: yang disebut banner kini persis isi dropdown di bawahnya.
						setDetectedRegion(
							[matchedVill?.name, matchedDist?.name, matchedCity?.name, matchedProv?.name]
								.filter(Boolean)
								.join(', '),
						);

						setData((prev) => ({
							...prev,
							province_code: pCode,
							city_code: cCode,
							district_code: dCode,
							village_code: vCode,
						}));
					}
				} catch (e) {
					// Reverse geocode gagal - biarkan user mengisi wilayah secara manual
				} finally {
					setIsDetecting(false);
				}
			},
			() => setIsDetecting(false),
			GEO_OPTIONS.oneShot,
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const onSubmit = (e) => {
		e.preventDefault();
		post(route('profile.complete.store'));
	};

	return (
		<div className="mx-auto w-full max-w-2xl py-8">
			<Card className="rounded-xl border border-border bg-card shadow-none">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
						<IconShieldCheck className="h-5 w-5 text-destructive" /> Lengkapi Profil Anda
					</CardTitle>
					<CardDescription className="text-sm leading-relaxed text-muted-foreground">
						Sebelum melanjutkan, mohon lengkapi nomor HP dan wilayah domisili Anda sampai tingkat desa. Data
						ini dipakai untuk menentukan jangkauan notifikasi darurat di sekitar Anda.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit} className="space-y-5">
						{isDetecting && (
							<div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3 text-xs font-medium text-muted-foreground">
								<IconLoader2 className="h-4 w-4 animate-spin" /> Mendeteksi lokasi Anda...
							</div>
						)}
						{!isDetecting && detectedRegion && (
							<div className="flex items-start gap-2 rounded-lg border border-border bg-muted p-3 text-xs leading-relaxed text-foreground/80">
								<IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
								<span>
									Lokasi terdeteksi di <b>{detectedRegion}</b>. Wilayah di bawah sudah terisi otomatis
									- periksa dan sesuaikan bila kurang tepat.
									{!data.village_code && (
										<span className="mt-1 block font-medium text-foreground">
											Kelurahan/Desa belum bisa ditentukan otomatis - silakan pilih sendiri di
											bawah.
										</span>
									)}
								</span>
							</div>
						)}

						<div className="space-y-1.5">
							<Label htmlFor="phone">No. HP</Label>
							<Input
								id="phone"
								value={data.phone}
								onChange={(e) => setData('phone', e.target.value)}
								placeholder="08xxxxxxxxxx"
							/>
							{errors.phone && <InputError message={errors.phone} />}
						</div>

						<div className="space-y-1.5">
							<Label>Provinsi</Label>
							<Combobox
								items={provinces}
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
						</div>

						<div className="space-y-1.5">
							<Label>Kabupaten / Kota</Label>
							<Combobox
								items={cities}
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
						</div>

						<div className="space-y-1.5">
							<Label>Kecamatan</Label>
							<Combobox
								items={districts}
								value={data.district_code}
								disabled={!data.city_code}
								onChange={(val) =>
									setData((prev) => ({ ...prev, district_code: val, village_code: '' }))
								}
								placeholder="Pilih Kecamatan..."
							/>
							{errors.district_code && <InputError message={errors.district_code} />}
						</div>

						<div className="space-y-1.5">
							<Label>Kelurahan / Desa</Label>
							<Combobox
								items={villages}
								value={data.village_code}
								disabled={!data.district_code}
								onChange={(val) => setData('village_code', val)}
								placeholder="Pilih Kelurahan/Desa..."
							/>
							{errors.village_code && <InputError message={errors.village_code} />}
						</div>

						{/* Banjar — satuan komunitas di bawah desa. Ditanyakan di SINI, bukan di form
						    daftar (keputusan user 2026-08-26): layar ini sudah menanyakan wilayah sampai desa
						    sehingga pilihannya bisa langsung disaring, sementara menambahkannya ke form daftar
						    berarti menanyakan wilayah dua kali dan memberatkan pendaftaran darurat.
						    Selalu ditampilkan sejak 2026-08-26: warga kini bisa mengusulkan banjar yang belum
						    terdaftar, jadi menyembunyikannya saat daftar kosong justru menutup satu-satunya
						    jalan mengisi 11 desa yang masternya masih nihil. */}
						<BanjarField
							villageCode={data.village_code}
							value={data.banjar_id}
							onChange={(val) => setData('banjar_id', val)}
							error={errors.banjar_id}
							required={banjar_required}
							className="space-y-1.5"
						/>

						<Button
							type="submit"
							disabled={processing}
							className="h-11 w-full rounded-lg bg-destructive font-bold uppercase tracking-wider text-destructive-foreground shadow-none hover:bg-destructive/90"
						>
							{processing ? <IconLoader2 className="h-4 w-4 animate-spin" /> : 'Simpan & Lanjutkan'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

CompleteProfile.layout = (page) => <AppLayout children={page} title="Lengkapi Profil" />;
