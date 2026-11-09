import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Combobox } from '@/Components/ui/combobox';
import { Label } from '@/Components/ui/label';
import { GEO_OPTIONS } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { IconCurrentLocation, IconLoader2, IconMapPin } from '@tabler/icons-react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

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

const REMOVE_WORDS = ['provinsi', 'prov', 'kota', 'kabupaten', 'kab', 'kecamatan', 'kec', 'kelurahan', 'desa'];

/**
 * Isian wilayah Provinsi -> Kabupaten/Kota -> Kecamatan -> Desa + deteksi lokasi (dipisah dari
 * Lengkapi Profil 2026-11-06 supaya kartu "Ubah Wilayah" di Profil memakai logika yang sama).
 * `data`/`setData`/`errors` milik useForm pemanggil (kolom province_code, city_code,
 * district_code, village_code).
 *
 * `autoDetect`: deteksi langsung saat dibuka (Lengkapi Profil); tanpa itu hanya lewat tombol.
 *
 * Laporan user 2026-11-06: orang yang mendaftar SAAT berada di Bangli/Badung terisi wilayah
 * Bangli/Badung - padahal tinggal (atau bertugas) di kota tenant. Kini hasil deteksi di LUAR
 * kabupaten/kota tenant TIDAK diisikan otomatis: isian diarahkan ke kota tenant dan pengguna
 * memilih sendiri (atau sengaja menekan "Tetap pakai lokasi terdeteksi").
 */
export default function RegionFields({ data, setData, errors, provinces, autoDetect = false }) {
	const tenantCity = usePage().props.tenant?.city_code || '';

	const [cities, setCities] = useState([]);
	const [districts, setDistricts] = useState([]);
	const [villages, setVillages] = useState([]);
	const [isDetecting, setIsDetecting] = useState(autoDetect);
	const [detectedRegion, setDetectedRegion] = useState('');
	// Hasil deteksi di luar kota tenant, ditahan sampai pengguna memilih memakainya.
	const [outside, setOutside] = useState(null);
	const started = useRef(false);

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

	const applyCodes = (codes) =>
		setData((prev) => ({
			...prev,
			province_code: codes.province_code,
			city_code: codes.city_code,
			district_code: codes.district_code,
			village_code: codes.village_code,
			banjar_id: '',
		}));

	const detect = () => {
		if (!navigator.geolocation) {
			setIsDetecting(false);
			return;
		}
		setIsDetecting(true);
		setOutside(null);

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const { latitude, longitude } = position.coords;
				try {
					const res = await axios.get(route('api.geocode.reverse'), {
						params: { lat: latitude, lng: longitude },
					});
					const addr = res.data?.address;
					if (!addr) return;

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

					let pCode = '',
						cCode = '',
						dCode = '',
						vCode = '';
					let matchedCity = null,
						matchedDist = null,
						matchedVill = null;
					let cityList = [],
						distList = [],
						villList = [];

					const matchedProv = matchRegionName(provinces, osmNames, REMOVE_WORDS);
					if (matchedProv) pCode = matchedProv.code;

					if (pCode) {
						cityList = (await axios.get(`/api/regions/cities/${pCode}`)).data;
						matchedCity = matchRegionName(cityList, osmNames, REMOVE_WORDS);
						if (matchedCity) cCode = matchedCity.code;
					}
					if (cCode) {
						distList = (await axios.get(`/api/regions/districts/${cCode}`)).data;
						matchedDist = matchRegionName(distList, osmNames, REMOVE_WORDS);
						if (matchedDist) dCode = matchedDist.code;
					}
					if (dCode) {
						villList = (await axios.get(`/api/regions/villages/${dCode}`)).data;
						matchedVill = matchRegionName(villList, osmNames, REMOVE_WORDS);
						if (matchedVill) vCode = matchedVill.code;
					}

					// Nama wilayah yang cocok dengan tabel `indonesia_*`, BUKAN `display_name` mentah
					// Nominatim (bisa beraksara non-Latin, FINDINGS #83).
					const name = [matchedVill?.name, matchedDist?.name, matchedCity?.name, matchedProv?.name]
						.filter(Boolean)
						.join(', ');
					const codes = { province_code: pCode, city_code: cCode, district_code: dCode, village_code: vCode };

					if (tenantCity && cCode && cCode !== tenantCity) {
						// Di luar kota tenant: jangan diisikan diam-diam. Arahkan ke kota tenant.
						const tenantProv = tenantCity.slice(0, 2);
						const tenantCities =
							tenantProv === pCode
								? cityList
								: (await axios.get(`/api/regions/cities/${tenantProv}`)).data;
						const tenantCityName = tenantCities.find((c) => c.code === tenantCity)?.name || '';
						setOutside({ name, codes, tenantCityName });
						setDetectedRegion('');
						applyCodes({
							province_code: tenantProv,
							city_code: tenantCity,
							district_code: '',
							village_code: '',
						});
						return;
					}

					setCities(cityList);
					setDistricts(distList);
					setVillages(villList);
					setDetectedRegion(name);
					applyCodes(codes);
				} catch (e) {
					// Reverse geocode gagal - biarkan user mengisi wilayah secara manual
				} finally {
					setIsDetecting(false);
				}
			},
			() => setIsDetecting(false),
			GEO_OPTIONS.oneShot,
		);
	};

	useEffect(() => {
		if (autoDetect && !started.current) {
			started.current = true;
			detect();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const useOutside = () => {
		applyCodes(outside.codes);
		setDetectedRegion(outside.name);
		setOutside(null);
	};

	return (
		<>
			{isDetecting && (
				<div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3 text-xs font-medium text-muted-foreground">
					<IconLoader2 className="h-4 w-4 animate-spin" /> Mendeteksi lokasi Anda...
				</div>
			)}
			{!isDetecting && outside && (
				<div className="flex items-start gap-2 rounded-lg border border-border bg-muted p-3 text-xs leading-relaxed text-foreground">
					<IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
					<div>
						Posisi Anda saat ini terdeteksi di <b>{outside.name}</b>
						{outside.tenantCityName && <>, di luar {outside.tenantCityName}</>}. Isian di bawah TIDAK diisi
						dengan lokasi itu - pilih sendiri wilayah yang benar.
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={useOutside}
							className="mt-2 h-8 w-full rounded-lg text-xs sm:w-auto"
						>
							Tetap pakai lokasi terdeteksi
						</Button>
					</div>
				</div>
			)}
			{!isDetecting && !outside && detectedRegion && (
				<div className="flex items-start gap-2 rounded-lg border border-border bg-muted p-3 text-xs leading-relaxed text-foreground/80">
					<IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
					<span>
						Lokasi terdeteksi di <b>{detectedRegion}</b>. Wilayah di bawah sudah terisi otomatis - periksa
						dan sesuaikan bila kurang tepat.
						{!data.village_code && (
							<span className="mt-1 block font-medium text-foreground">
								Kelurahan/Desa belum bisa ditentukan otomatis - silakan pilih sendiri di bawah.
							</span>
						)}
					</span>
				</div>
			)}
			{!autoDetect && !isDetecting && (
				<Button type="button" variant="outline" onClick={detect} className="h-10 w-full rounded-lg text-sm">
					<IconCurrentLocation className="h-4 w-4" /> Isi dari lokasi saya sekarang
				</Button>
			)}

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
							banjar_id: '',
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
							banjar_id: '',
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
						setData((prev) => ({ ...prev, district_code: val, village_code: '', banjar_id: '' }))
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
					onChange={(val) => setData((prev) => ({ ...prev, village_code: val, banjar_id: '' }))}
					placeholder="Pilih Kelurahan/Desa..."
				/>
				{errors.village_code && <InputError message={errors.village_code} />}
			</div>
		</>
	);
}
