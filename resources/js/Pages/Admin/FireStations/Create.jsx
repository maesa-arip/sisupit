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
import { MAP_TILE_URL } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import {
	IconArrowLeft,
	IconArrowsMove,
	IconClick,
	IconCurrentLocation,
	IconDeviceFloppy,
	IconFiretruck,
	IconInfoCircle,
	IconLoader2,
	IconLock,
	IconSearch,
} from '@tabler/icons-react';
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

export default function Create({ tenant_location, provinces, cities, districts, admin_level, admin_region_names }) {
	const defaultLat = tenant_location?.lat || -8.65;
	const defaultLng = tenant_location?.lng || 115.22;

	const { data, setData, reset, post, processing, errors } = useForm({
		name: '',
		address: '',
		status: 'Aktif',
		type: 'Pos Induk',
		phone: '',
		vehicle_count: 1,
		lat: defaultLat,
		lng: defaultLng,
		province_code: admin_level?.province_code || '',
		city_code: admin_level?.city_code || '',
		district_code: admin_level?.district_code || '',
		village_code: admin_level?.village_code || '',
	});

	const onHandleChange = (e) => setData(e.target.name, e.target.value);

	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const [currentStep, setCurrentStep] = useState(1);

	const skipSearchRef = useRef(false);

	const [dynamicCities, setDynamicCities] = useState(cities || []);
	const [dynamicDistricts, setDynamicDistricts] = useState(districts || []);
	const [villages, setVillages] = useState([]);

	const mapRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const markerRef = useRef(null);

	useEffect(() => {
		if (!admin_level?.city_code && data.province_code) {
			fetch(`/api/regions/cities/${data.province_code}`)
				.then((res) => res.json())
				.then((resData) => setDynamicCities(resData));
		}
	}, [data.province_code]);

	useEffect(() => {
		if (!admin_level?.city_code && data.city_code) {
			fetch(`/api/regions/districts/${data.city_code}`)
				.then((res) => res.json())
				.then((resData) => setDynamicDistricts(resData));
		}
	}, [data.city_code]);

	useEffect(() => {
		if (data.district_code && !admin_level?.village_code) {
			fetch(`/api/regions/villages/${data.district_code}`)
				.then((res) => res.json())
				.then((resData) => setVillages(resData));
		}
	}, [data.district_code]);

	useEffect(() => {
		if (!window.L || mapInstanceRef.current) return;
		mapInstanceRef.current = window.L.map(mapRef.current, { zoomControl: false }).setView([data.lat, data.lng], 13);
		window.L.tileLayer(MAP_TILE_URL).addTo(mapInstanceRef.current);
		window.L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);

		const customIcon = window.L.divIcon({
			html: `<div class="text-teal-600 dark:text-teal"><svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="currentColor"><path d="M18.364 17.364L12 23.728l-6.364-6.364a9 9 0 1 1 12.728 0zM12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg></div>`,
			className: 'bg-transparent border-none drop-shadow-md',
			iconSize: [42, 42],
			iconAnchor: [21, 42],
		});

		markerRef.current = window.L.marker([data.lat, data.lng], { icon: customIcon, draggable: true }).addTo(
			mapInstanceRef.current,
		);
		markerRef.current.on('dragstart', () => setCurrentStep(2));
		markerRef.current.on('dragend', (e) => updateLocationData(e.target.getLatLng().lat, e.target.getLatLng().lng));
		mapInstanceRef.current.on('click', (e) => {
			markerRef.current.setLatLng(e.latlng);
			updateLocationData(e.latlng.lat, e.latlng.lng);
			setCurrentStep(2);
		});

		return () => {
			if (mapInstanceRef.current) {
				mapInstanceRef.current.remove();
				mapInstanceRef.current = null;
			}
		};
	}, []);

	const updateLocationData = async (lat, lng, customSearchText = null) => {
		try {
			const response = await fetch(route('api.geocode.reverse', { lat, lng }));
			const result = await response.json();

			const addr = result?.address || {};
			let searchBarText = '';

			if (customSearchText) {
				searchBarText = customSearchText;
			} else {
				if (addr.road && !addr.road.toLowerCase().includes('no name')) {
					searchBarText = addr.road;
				} else if (addr.pedestrian || addr.path) {
					searchBarText = addr.pedestrian || addr.path;
				} else if (addr.village || addr.suburb || addr.town) {
					searchBarText = addr.village || addr.suburb || addr.town;
				} else {
					const parts = (result?.display_name || '').split(',');
					const validPart = parts.find(
						(p) => !p.toLowerCase().includes('no name') && !p.toLowerCase().includes('unnamed'),
					);
					searchBarText = validPart ? validPart.trim() : 'Area Tanpa Nama';
				}
			}

			skipSearchRef.current = true;
			setSearchQuery(searchBarText);

			let pCode = admin_level?.province_code || '';
			let cCode = admin_level?.city_code || '';
			let dCode = admin_level?.district_code || '';
			let vCode = admin_level?.village_code || '';

			if (result?.address) {
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

				if (!admin_level?.province_code && osmNames.length > 0) {
					const matchedProv = matchRegionName(provinces, osmNames, removeWords);
					if (matchedProv) pCode = matchedProv.code;
				}
				if (!admin_level?.city_code && pCode) {
					const res = await fetch(`/api/regions/cities/${pCode}`);
					const citiesData = await res.json();
					setDynamicCities(citiesData);
					const matchedCity = matchRegionName(citiesData, osmNames, removeWords);
					if (matchedCity) cCode = matchedCity.code;
				}
				if (!admin_level?.district_code && cCode) {
					const res = await fetch(`/api/regions/districts/${cCode}`);
					const distData = await res.json();
					setDynamicDistricts(distData);
					const matchedDist = matchRegionName(distData, osmNames, removeWords);
					if (matchedDist) dCode = matchedDist.code;
				}
				if (!admin_level?.village_code && dCode) {
					const res = await fetch(`/api/regions/villages/${dCode}`);
					const villData = await res.json();
					setVillages(villData);
					const matchedVill = matchRegionName(villData, osmNames, removeWords);
					if (matchedVill) vCode = matchedVill.code;
				}
			}

			setData((current) => ({
				...current,
				lat: lat.toFixed(6),
				lng: lng.toFixed(6),
				address: result?.display_name || current.address,
				province_code: pCode,
				city_code: cCode,
				district_code: dCode,
				village_code: vCode,
			}));
		} catch (error) {
			console.error('Gagal reverse geocoding:', error);
			setData((current) => ({ ...current, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
		}
	};

	useEffect(() => {
		if (!searchQuery || searchQuery.length < 3) {
			setSearchResults([]);
			return;
		}

		if (skipSearchRef.current) {
			skipSearchRef.current = false;
			return;
		}

		setIsSearching(true);

		const delayDebounceFn = setTimeout(async () => {
			try {
				const response = await fetch(route('api.geocode.search', { q: searchQuery }));
				setSearchResults(await response.json());
			} catch (error) {
				console.error('Pencarian gagal', error);
			} finally {
				setIsSearching(false);
			}
		}, 1000);

		return () => clearTimeout(delayDebounceFn);
	}, [searchQuery]);

	const selectSearchResult = (result) => {
		const lat = parseFloat(result.lat),
			lng = parseFloat(result.lon);
		if (mapInstanceRef.current && markerRef.current) {
			mapInstanceRef.current.flyTo([lat, lng], 17);
			markerRef.current.setLatLng([lat, lng]);
		}
		const selectedName = result.name || result.display_name.split(',')[0];
		skipSearchRef.current = true;
		updateLocationData(lat, lng, selectedName);
		setSearchResults([]);
		if (typeof setCurrentStep === 'function') setCurrentStep(2);
	};

	const onHandleSubmit = (e) => {
		e.preventDefault();
		post(route('admin.fire-stations.store'), {
			preserveScroll: true,
			preserveState: true,
			onSuccess: (page) => {
				const flash = page.props.flash;
				if (flash?.success) toast.success(flash.success);
				else if (flash?.error) toast.error(flash.error);
			},
		});
	};

	const getHelperText = () => {
		if (admin_level?.village_code)
			return 'Wewenang Desa: Anda hanya dapat mengelola data di wilayah desa Anda. Yurisdiksi telah dikunci otomatis.';
		if (admin_level?.district_code)
			return 'Wewenang Kecamatan: Anda dapat mengatur penempatan tingkat Kelurahan/Desa pada kecamatan Anda.';
		if (admin_level?.city_code)
			return 'Wewenang Kabupaten/Kota: Anda dapat mengatur penempatan di tingkat Kecamatan hingga Desa.';
		if (admin_level?.province_code)
			return 'Wewenang Provinsi: Anda dapat mengatur penempatan di tingkat Kabupaten hingga Desa.';
		return 'Wewenang Pusat: Anda memiliki akses penuh untuk mengatur seluruh yurisdiksi aset di Indonesia.';
	};

	const handleLockedClick = () =>
		toast.error(
			'Wewenang Terbatas: Anda tidak dapat mengubah atau menambah data di luar yurisdiksi wilayah tugas Anda.',
		);

	const LockedField = ({ label, value }) => (
		<div className="grid cursor-not-allowed gap-1.5" onClick={handleLockedClick} title="Klik untuk info">
			<Label className="text-muted-foreground">{label}</Label>
			<div className="pointer-events-none relative">
				<Input
					readOnly
					value={value || 'Memuat...'}
					className="border-dashed bg-accent/50 pr-10 font-medium text-muted-foreground shadow-none focus-visible:ring-0"
				/>
				<IconLock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-50" />
			</div>
		</div>
	);

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<Head title="Registrasi Pos Pemadam Baru" />

			<div className="mb-2 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title="Registrasi Pos Pemadam Baru"
					subtitle="Pendataan spasial markas & armada pemadam."
					icon={IconFiretruck}
				/>
				<Button variant="secondary" size="sm" asChild>
					<Link href={route('admin.fire-stations.index')}>
						<IconArrowLeft className="mr-1.5 size-4" /> Kembali
					</Link>
				</Button>
			</div>

			<div className="flex w-full flex-col items-start gap-5 lg:flex-row lg:gap-6">
				<div className="flex w-full shrink-0 flex-col gap-5 lg:w-5/12 xl:w-1/3">
					<Card className="border-border shadow-none">
						<CardContent className="p-6">
							<form className="space-y-5" onSubmit={onHandleSubmit}>
								<div className="flex items-start gap-3 rounded-md border border-teal-100 bg-teal-50 p-3 text-teal-700 dark:border-teal/30 dark:bg-teal/10 dark:text-teal">
									<IconInfoCircle className="mt-0.5 h-5 w-5 shrink-0" />
									<p className="text-xs font-medium leading-relaxed">{getHelperText()}</p>
								</div>

								<div className="relative grid gap-1.5">
									<Label>
										Cari Lokasi di Peta
										<span className="ml-1 text-[11px] font-normal text-muted-foreground">
											(Ketik min. 3 huruf)
										</span>
									</Label>

									<div className="relative w-full">
										<IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											placeholder="Ketik jalan atau desa..."
											className="h-9 w-full pl-9 pr-10 shadow-sm focus-visible:ring-teal-500 dark:focus-visible:ring-teal"
										/>
										{isSearching && (
											<div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center">
												<IconLoader2 className="h-4 w-4 animate-spin text-teal-600 dark:text-teal" />
											</div>
										)}
									</div>

									{searchResults.length > 0 && (
										<div className="absolute left-0 right-0 top-full z-[999] mt-1 max-h-48 overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-xl">
											{searchResults.map((res, idx) => (
												<button
													key={idx}
													type="button"
													onClick={() => selectSearchResult(res)}
													className="flex w-full gap-2 border-b border-border px-3 py-2.5 text-left text-xs transition-colors last:border-0 hover:bg-accent"
												>
													<IconCurrentLocation className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal" />
													<div className="min-w-0 flex-1">
														<p className="truncate font-semibold">
															{res.name || res.display_name.split(',')[0]}
														</p>
														<p className="mt-0.5 truncate text-muted-foreground">
															{res.display_name}
														</p>
													</div>
												</button>
											))}
										</div>
									)}
								</div>

								<div className="flex flex-col gap-4 rounded-lg border border-border bg-accent/30 p-4">
									<h4 className="flex items-center justify-between text-xs font-bold uppercase text-muted-foreground">
										Area Yurisdiksi{' '}
										{currentStep === 2 && (
											<span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] text-teal-700 dark:bg-teal/10 dark:text-teal">
												Auto-detected
											</span>
										)}
									</h4>

									<div className="grid gap-1.5">
										{admin_level?.province_code ? (
											<LockedField label="Provinsi" value={admin_region_names?.province} />
										) : (
											<>
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
											</>
										)}
									</div>

									<div className="grid gap-1.5">
										{admin_level?.city_code ? (
											<LockedField label="Kabupaten / Kota" value={admin_region_names?.city} />
										) : (
											<>
												<Label>Kabupaten / Kota</Label>
												<Combobox
													items={dynamicCities}
													value={data.city_code}
													disabled={!data.province_code && !admin_level?.province_code}
													onChange={(val) =>
														setData((prev) => ({
															...prev,
															city_code: val,
															district_code: '',
															village_code: '',
														}))
													}
													placeholder="Pilih Kota/Kabupaten..."
												/>
												{errors.city_code && <InputError message={errors.city_code} />}
											</>
										)}
									</div>

									<div className="grid gap-1.5">
										{admin_level?.district_code ? (
											<LockedField label="Kecamatan" value={admin_region_names?.district} />
										) : (
											<>
												<Label>Kecamatan</Label>
												<Combobox
													items={dynamicDistricts}
													value={data.district_code}
													disabled={!data.city_code && !admin_level?.city_code}
													onChange={(val) =>
														setData((prev) => ({
															...prev,
															district_code: val,
															village_code: '',
														}))
													}
													placeholder="Pilih Kecamatan..."
												/>
												{errors.district_code && <InputError message={errors.district_code} />}
											</>
										)}
									</div>

									<div className="grid gap-1.5">
										{admin_level?.village_code ? (
											<LockedField label="Kelurahan / Desa" value={admin_region_names?.village} />
										) : (
											<>
												<Label>Kelurahan / Desa</Label>
												<Combobox
													items={villages}
													value={data.village_code}
													disabled={!data.district_code}
													onChange={(val) => setData('village_code', val)}
													placeholder="Pilih Desa/Kelurahan..."
												/>
												{errors.village_code && <InputError message={errors.village_code} />}
											</>
										)}
									</div>
								</div>

								<div className="grid gap-1.5">
									<Label htmlFor="name">Nama Pos</Label>
									<Input
										name="name"
										id="name"
										value={data.name}
										onChange={onHandleChange}
										className="focus-visible:ring-teal-500 dark:focus-visible:ring-teal"
										placeholder="Misal: Pos Induk BPBD Denpasar"
									/>
									{errors.name && <InputError message={errors.name} />}
								</div>

								<div className="grid gap-1.5">
									<Label htmlFor="address">Alamat Lapangan</Label>
									<Textarea
										name="address"
										id="address"
										rows="2"
										value={data.address}
										onChange={onHandleChange}
										className="resize-none focus-visible:ring-teal-500 dark:focus-visible:ring-teal"
									/>
									{errors.address && <InputError message={errors.address} />}
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="grid gap-1.5">
										<Label>Jenis Pos</Label>
										<Select
											defaultValue={data.type}
											onValueChange={(value) => setData('type', value)}
										>
											<SelectTrigger className="focus-visible:ring-teal-500 dark:focus-visible:ring-teal">
												<SelectValue placeholder="Pilih Jenis" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Pos Induk">Pos Induk</SelectItem>
												<SelectItem value="Pos Sektor">Pos Sektor</SelectItem>
												<SelectItem value="Pos Relawan">Pos Relawan</SelectItem>
											</SelectContent>
										</Select>
										{errors.type && <InputError message={errors.type} />}
									</div>
									<div className="grid gap-1.5">
										<Label>Status</Label>
										<Select
											defaultValue={data.status}
											onValueChange={(value) => setData('status', value)}
										>
											<SelectTrigger className="focus-visible:ring-teal-500 dark:focus-visible:ring-teal">
												<SelectValue placeholder="Pilih Status" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Aktif">Beroperasi</SelectItem>
												<SelectItem value="Perbaikan">Perbaikan</SelectItem>
											</SelectContent>
										</Select>
										{errors.status && <InputError message={errors.status} />}
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="grid gap-1.5">
										<Label htmlFor="phone">No. Telepon Darurat</Label>
										<Input
											name="phone"
											id="phone"
											value={data.phone}
											onChange={onHandleChange}
											className="focus-visible:ring-teal-500 dark:focus-visible:ring-teal"
											placeholder="Misal: 0361-113"
										/>
										{errors.phone && <InputError message={errors.phone} />}
									</div>
									<div className="grid gap-1.5">
										<Label htmlFor="vehicle_count">Jumlah Armada</Label>
										<Input
											type="number"
											name="vehicle_count"
											id="vehicle_count"
											value={data.vehicle_count}
											onChange={onHandleChange}
											className="focus-visible:ring-teal-500 dark:focus-visible:ring-teal"
											placeholder="Misal: 3"
										/>
										{errors.vehicle_count && <InputError message={errors.vehicle_count} />}
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
									<div className="grid gap-1.5">
										<Label className="flex items-center gap-1 text-muted-foreground">
											<IconLock className="h-3 w-3" /> Latitude
										</Label>
										<Input
											readOnly
											value={data.lat}
											className="cursor-not-allowed border-dashed border-input bg-accent/50 font-mono text-muted-foreground shadow-none focus-visible:ring-0"
										/>
									</div>
									<div className="grid gap-1.5">
										<Label className="flex items-center gap-1 text-muted-foreground">
											<IconLock className="h-3 w-3" /> Longitude
										</Label>
										<Input
											readOnly
											value={data.lng}
											className="cursor-not-allowed border-dashed border-input bg-accent/50 font-mono text-muted-foreground shadow-none focus-visible:ring-0"
										/>
									</div>
								</div>

								<div className="flex justify-end gap-2 pt-2">
									<Button
										type="button"
										variant="secondary"
										onClick={() => {
											reset();
											setCurrentStep(1);
										}}
									>
										Reset
									</Button>
									<Button
										type="submit"
										disabled={processing}
										className="border-transparent bg-teal-600 text-white shadow-none hover:bg-teal-700 dark:bg-teal dark:hover:bg-teal/90"
									>
										<IconDeviceFloppy className="mr-2 h-4 w-4" /> Simpan
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>

				<div className="relative flex h-[500px] w-full flex-col overflow-hidden rounded-2xl border bg-accent lg:h-[calc(100vh-140px)] lg:flex-1">
					<div className="pointer-events-none absolute left-4 top-4 z-[400]">
						<div className="flex w-full flex-wrap gap-2">
							<div
								className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm transition-all ${currentStep === 1 ? 'animate-pulse bg-teal-600 text-white dark:bg-teal' : 'border bg-background text-muted-foreground'}`}
							>
								<IconClick className="h-3.5 w-3.5" /> <span>1. Klik Area Peta</span>
							</div>
							<div
								className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm transition-all ${currentStep === 2 ? 'bg-teal-600 text-white dark:bg-teal' : 'border bg-background text-muted-foreground'}`}
							>
								<IconArrowsMove className="h-3.5 w-3.5" /> <span>2. Geser Pin</span>
							</div>
						</div>
					</div>
					<div ref={mapRef} className="z-0 h-full w-full"></div>
				</div>
			</div>
		</div>
	);
}
Create.layout = (page) => <AppLayout children={page} title="Registrasi Pos Pemadam" />;
