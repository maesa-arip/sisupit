import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import {
	IconArrowLeft,
	IconArrowsMove,
	IconClick,
	IconCurrentLocation,
	IconDeviceFloppy,
	IconDroplet,
	IconInfoCircle,
	IconLoader2,
	IconLock,
	IconSearch,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Helper: Fungsi Pencocokan Cerdas Teks Peta dengan Database
// Helper: Fungsi Pencocokan Cerdas Teks Peta dengan Database
// Helper: Algoritma Pencocokan "Sapu Jagat" (Omni-Search)
const matchRegionName = (dbList, osmNamesArray, removeWords = []) => {
    if (!osmNamesArray || osmNamesArray.length === 0 || !dbList || dbList.length === 0) return null;
    
    // 1. Bersihkan semua elemen array dari OSM
    const cleanOsmNames = osmNamesArray.map(name => {
        let clean = name.toLowerCase();
        removeWords.forEach(w => { clean = clean.replace(new RegExp(`\\b${w}\\b`, 'gi'), ''); });
        return clean.replace(/[^\w\s]/gi, '').trim();
    }).filter(n => n.length > 0);

    // 2. TAHAP 1: Cari Kecocokan Persis (Exact Match)
    let matched = dbList.find(dbItem => {
        let itemName = dbItem.name.toLowerCase();
        removeWords.forEach(w => { itemName = itemName.replace(new RegExp(`\\b${w}\\b`, 'gi'), ''); });
        itemName = itemName.replace(/[^\w\s]/gi, '').trim();
        return cleanOsmNames.includes(itemName); // Harus persis sama
    });

    // 3. TAHAP 2: Jika Exact Match gagal, cari yang namanya mengandung (Partial Match)
    if (!matched) {
        matched = dbList.find(dbItem => {
            let itemName = dbItem.name.toLowerCase();
            removeWords.forEach(w => { itemName = itemName.replace(new RegExp(`\\b${w}\\b`, 'gi'), ''); });
            itemName = itemName.replace(/[^\w\s]/gi, '').trim();
            return cleanOsmNames.some(osmName => itemName.includes(osmName) || osmName.includes(itemName));
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
		type: 'Stick',
		description: '',
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

    // TAMBAHKAN INI: Kunci pintar untuk membedakan ketikan vs auto-fill sistem
    const skipSearchRef = useRef(false);

	const [dynamicCities, setDynamicCities] = useState(cities || []);
	const [dynamicDistricts, setDynamicDistricts] = useState(districts || []);
	const [villages, setVillages] = useState([]);

	const mapRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const markerRef = useRef(null);

	// Effect Pengambilan Manual oleh User
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
		window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(
			mapInstanceRef.current,
		);
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

	// FUNGSI AUTO-FILL KEAJAIBAN UX (VERSI FINAL - ANTI NO-NAME & ANTI GAGAL)
// Tambahkan parameter ke-3: customSearchText = null
    const updateLocationData = async (lat, lng, customSearchText = null) => {
        try {
            const response = await fetch(route('api.geocode.reverse', { lat, lng }));
            const result = await response.json();
            
            const addr = result?.address || {};

            // --- 1. PERBAIKAN SEARCH BAR (HORMATI PILIHAN USER) ---
            let searchBarText = '';
            
            if (customSearchText) {
                // JIKA USER MEMILIH DARI DROPDOWN PENCARIAN -> Gunakan nama yang dipilih
                searchBarText = customSearchText;
            } else {
                // JIKA USER MENGGESER PETA / KLIK PETA SECARA MANUAL -> Deteksi jalan/desa
                if (addr.road && !addr.road.toLowerCase().includes('no name')) {
                    searchBarText = addr.road; 
                } else if (addr.pedestrian || addr.path) {
                    searchBarText = addr.pedestrian || addr.path;
                } else if (addr.village || addr.suburb || addr.town) {
                    searchBarText = addr.village || addr.suburb || addr.town; 
                } else {
                    const parts = (result?.display_name || '').split(',');
                    const validPart = parts.find(p => !p.toLowerCase().includes('no name') && !p.toLowerCase().includes('unnamed'));
                    searchBarText = validPart ? validPart.trim() : "Area Tanpa Nama";
                }
            }

            skipSearchRef.current = true;
            
            // Set ke kotak pencarian
            setSearchQuery(searchBarText);
            // -------------------------------------------------------

            // --- 2. AUTO-FILL YURISDIKSI (OMNI-SEARCH TETAP JALAN!) ---
            let pCode = admin_level?.province_code || '';
            let cCode = admin_level?.city_code || '';
            let dCode = admin_level?.district_code || '';
            let vCode = admin_level?.village_code || '';

            if (result?.address) {
                const rawOsmNames = [
                    addr.state, addr.region, addr.city, addr.county, addr.regency, 
                    addr.town, addr.city_district, addr.municipality, addr.district, 
                    addr.suburb, addr.village, addr.neighbourhood, addr.hamlet
                ];

                const osmNames = rawOsmNames.filter(n => n && !n.toLowerCase().includes('no name'));
                const removeWords = ['provinsi', 'prov', 'kota', 'kabupaten', 'kab', 'kecamatan', 'kec', 'kelurahan', 'desa'];

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
            // ---------------------------------------------------------------------

            setData(current => ({ 
                ...current, 
                lat: lat.toFixed(6), 
                lng: lng.toFixed(6), 
                address: result?.display_name || current.address,
                province_code: pCode, 
                city_code: cCode, 
                district_code: dCode, 
                village_code: vCode
            }));
            
        } catch (error) { 
            console.error("Gagal reverse geocoding:", error);
            setData(current => ({ ...current, lat: lat.toFixed(6), lng: lng.toFixed(6) })); 
        }
    };

	// EFEK DEBOUNCE PENCARIAN (Hanya dieksekusi jika searchQuery berubah)
    useEffect(() => {
        // 1. Bersihkan hasil jika teks kosong atau kurang dari 3 huruf
        if (!searchQuery || searchQuery.length < 3) {
            setSearchResults([]);
            return;
        }

        // 2. ANTI-LOOPING: Jika teks berubah karena klik map/dropdown, JANGAN fetch ke API
        if (skipSearchRef.current) {
            skipSearchRef.current = false; // Buka kunci lagi untuk ketikan selanjutnya
            return;
        }

        setIsSearching(true);

        // 3. DEBOUNCE: Tunggu 1000ms setelah user berhenti mengetik
        const delayDebounceFn = setTimeout(async () => {
            try {
                const response = await fetch(route('api.geocode.search', { q: searchQuery }));
                setSearchResults(await response.json());
            } catch (error) { 
                console.error("Pencarian gagal", error); 
            } finally { 
                setIsSearching(false); 
            }
        }, 1000); // 1 detik sangat aman dari banned Nominatim

        // 4. CLEANUP: Batalkan timeout jika user mengetik huruf baru sebelum 1000ms
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

	const selectSearchResult = (result) => {
        const lat = parseFloat(result.lat), lng = parseFloat(result.lon);
        if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 17);
            markerRef.current.setLatLng([lat, lng]);
        }
        const selectedName = result.name || result.display_name.split(',')[0];
        
        // KUNCI PENCARIAN: Beritahu useEffect bahwa ini bukan hasil ketikan manual
        skipSearchRef.current = true;
        
        updateLocationData(lat, lng, selectedName);
        setSearchResults([]); 
        if (typeof setCurrentStep === 'function') setCurrentStep(2);
    };

	const onHandleSubmit = (e) => {
		e.preventDefault();
		post(route('admin.hydrants.store'), {
			preserveScroll: true,
			preserveState: true,
			onSuccess: (page) => {
				const flash = page.props.flash;
				if (flash?.success) toast.success(flash.success);
				else if (flash?.error) toast.error(flash.error);
			},
		});
	};

	// UX Helpers
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
			<div className="relative pointer-events-none">
				<Input
					readOnly
					value={value || 'Memuat...'}
					className="pr-10 font-medium border-dashed shadow-none bg-accent/50 text-muted-foreground focus-visible:ring-0"
				/>
				<IconLock className="absolute w-4 h-4 -translate-y-1/2 opacity-50 right-3 top-1/2 text-muted-foreground" />
			</div>
		</div>
	);

	return (
		<div className="flex flex-col w-full h-full space-y-6">
			<Head title="Registrasi Hydrant Baru" />

			<div className="flex flex-col items-start justify-between mb-2 gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title="Registrasi Hydrant Baru"
					subtitle="Pendataan spasial dan teknis fasilitas hydrant."
					icon={IconDroplet}
				/>
				<Button variant="secondary" size="sm" asChild>
					<Link href={route('admin.hydrants.index')}>
						<IconArrowLeft className="mr-1.5 size-4" /> Kembali
					</Link>
				</Button>
			</div>

			<div className="flex flex-col items-start w-full gap-5 lg:flex-row lg:gap-6">
				<div className="flex flex-col w-full gap-5 shrink-0 lg:w-5/12 xl:w-1/3">
					<Card className="shadow-none border-border">
						<CardContent className="p-6">
							<form className="space-y-5" onSubmit={onHandleSubmit}>
								<div className="flex items-start gap-3 p-3 text-teal-700 dark:text-teal border border-teal-100 dark:border-teal/30 rounded-md bg-teal-50 dark:bg-teal/10">
									<IconInfoCircle className="mt-0.5 h-5 w-5 shrink-0" />
									<p className="text-xs font-medium leading-relaxed">{getHelperText()}</p>
								</div>

								{/* ========================================================= */}
{/* BLOK PENCARIAN PETA (SEARCH-AS-YOU-TYPE) */}
{/* ========================================================= */}
<div className="grid gap-1.5 relative">
    <Label>
        Cari Lokasi di Peta 
        <span className="text-muted-foreground font-normal text-[11px] ml-1">(Ketik min. 3 huruf)</span>
    </Label>
    
    <div className="relative w-full">
        {/* Ikon Kaca Pembesar (Kiri) - pointer-events-none agar tidak menghalangi klik input */}
        <IconSearch className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-3 top-1/2 text-muted-foreground" />
        
        <Input 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="Ketik jalan atau desa..." 
            // pl-9 untuk spasi kiri, pr-10 untuk spasi kanan, h-9 agar tinggi sejajar dengan Combobox
            className="w-full pr-10 shadow-sm pl-9 h-9 focus-visible:ring-teal-500 dark:focus-visible:ring-teal"
        />

        {/* Spinner Loading (Kanan) - Dibungkus div flex agar rotasinya sentris sempurna */}
        {isSearching && (
            <div className="absolute flex items-center justify-center -translate-y-1/2 pointer-events-none right-3 top-1/2">
                <IconLoader2 className="w-4 h-4 text-teal-600 dark:text-teal animate-spin" />
            </div>
        )}
    </div>
    
    {/* Dropdown Hasil Pencarian (z-[999] agar selalu tampil paling atas) */}
    {searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground border rounded-lg shadow-xl max-h-48 overflow-y-auto z-[999]">
            {searchResults.map((res, idx) => (
                <button 
                    key={idx} 
                    type="button" 
                    onClick={() => selectSearchResult(res)} 
                    className="w-full text-left px-3 py-2.5 hover:bg-accent border-b border-border last:border-0 text-xs flex gap-2 transition-colors"
                >
                    <IconCurrentLocation className="w-4 h-4 text-teal-600 dark:text-teal shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{res.name || res.display_name.split(',')[0]}</p>
                        <p className="text-muted-foreground truncate mt-0.5">{res.display_name}</p>
                    </div>
                </button>
            ))}
        </div>
    )}
</div>
{/* ========================================================= */}

								<div className="flex flex-col gap-4 p-4 border rounded-lg border-border bg-accent/30">
									<h4 className="flex items-center justify-between text-xs font-bold uppercase text-muted-foreground">
										Area Yurisdiksi{' '}
										{currentStep === 2 && (
											<span className="rounded-full bg-teal-100 dark:bg-teal/10 px-2 py-0.5 text-[10px] text-teal-700 dark:text-teal">
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
									<Label htmlFor="name">Nama Fasilitas</Label>
									<Input
										name="name"
										id="name"
										value={data.name}
										onChange={onHandleChange}
										className="focus-visible:ring-teal-500 dark:focus-visible:ring-teal"
										placeholder="Misal: Hydrant Pasar Badung"
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
										<Label>Konstruksi</Label>
										<Select
											defaultValue={data.type}
											onValueChange={(value) => setData('type', value)}
										>
											<SelectTrigger className="focus-visible:ring-teal-500 dark:focus-visible:ring-teal">
												<SelectValue placeholder="Pilih Jenis" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Stick">Stick</SelectItem>
												<SelectItem value="Jongkok">Jongkok</SelectItem>
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
												<SelectItem value="Aktif">Kondisi Baik</SelectItem>
												<SelectItem value="Perbaikan">Perbaikan</SelectItem>
											</SelectContent>
										</Select>
										{errors.status && <InputError message={errors.status} />}
									</div>
								</div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="description">Catatan (Opsional)</Label>
                                    <Input name="description" id="description" value={data.description} onChange={onHandleChange} className="focus-visible:ring-teal-500 dark:focus-visible:ring-teal" />
                                </div>

								<div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
									<div className="grid gap-1.5">
										<Label className="flex items-center gap-1 text-muted-foreground">
											<IconLock className="w-3 h-3" /> Latitude
										</Label>
										<Input
											readOnly
											value={data.lat}
											className="font-mono border-dashed shadow-none cursor-not-allowed border-input bg-accent/50 text-muted-foreground focus-visible:ring-0"
										/>
									</div>
									<div className="grid gap-1.5">
										<Label className="flex items-center gap-1 text-muted-foreground">
											<IconLock className="w-3 h-3" /> Longitude
										</Label>
										<Input
											readOnly
											value={data.lng}
											className="font-mono border-dashed shadow-none cursor-not-allowed border-input bg-accent/50 text-muted-foreground focus-visible:ring-0"
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
										className="text-white bg-teal-600 dark:bg-teal border-transparent shadow-none hover:bg-teal-700 dark:hover:bg-teal/90"
									>
										<IconDeviceFloppy className="w-4 h-4 mr-2" /> Simpan
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>

				<div className="relative flex h-[500px] w-full flex-col overflow-hidden rounded-2xl border bg-accent lg:h-[calc(100vh-140px)] lg:flex-1">
					<div className="pointer-events-none absolute left-4 top-4 z-[400]">
						<div className="flex flex-wrap w-full gap-2">
							<div
								className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm transition-all ${currentStep === 1 ? 'animate-pulse bg-teal-600 dark:bg-teal text-white' : 'border bg-background text-muted-foreground'}`}
							>
								<IconClick className="h-3.5 w-3.5" /> <span>1. Klik Area Peta</span>
							</div>
							<div
								className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm transition-all ${currentStep === 2 ? 'bg-teal-600 dark:bg-teal text-white' : 'border bg-background text-muted-foreground'}`}
							>
								<IconArrowsMove className="h-3.5 w-3.5" /> <span>2. Geser Pin</span>
							</div>
						</div>
					</div>
					<div ref={mapRef} className="z-0 w-full h-full"></div>
				</div>
			</div>
		</div>
	);
}
Create.layout = (page) => <AppLayout children={page} title="Registrasi Hydrant" />;
