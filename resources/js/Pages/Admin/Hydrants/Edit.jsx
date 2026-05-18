import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
// PERBAIKAN: Hanya mengimport Combobox tunggal sesuai komponen baru kita
import { Combobox } from "@/Components/ui/combobox";
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    IconArrowLeft, IconDroplet, IconSearch, IconLoader2, 
    IconMapPinFilled, IconDeviceFloppy, IconArrowsMove, IconCurrentLocation, IconLock, IconInfoCircle
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Helper: Algoritma Pencocokan "Sapu Jagat" (Omni-Search)
const matchRegionName = (dbList, osmNamesArray, removeWords = []) => {
    if (!osmNamesArray || osmNamesArray.length === 0 || !dbList || dbList.length === 0) return null;
    
    const cleanOsmNames = osmNamesArray.map(name => {
        let clean = name.toLowerCase();
        removeWords.forEach(w => { clean = clean.replace(new RegExp(`\\b${w}\\b`, 'gi'), ''); });
        return clean.replace(/[^\w\s]/gi, '').trim();
    }).filter(n => n.length > 0);

    let matched = dbList.find(dbItem => {
        let itemName = dbItem.name.toLowerCase();
        removeWords.forEach(w => { itemName = itemName.replace(new RegExp(`\\b${w}\\b`, 'gi'), ''); });
        itemName = itemName.replace(/[^\w\s]/gi, '').trim();
        return cleanOsmNames.includes(itemName);
    });

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

export default function Edit({ hydrant, hydrant_province, tenant_location, provinces, cities, districts, admin_level, admin_region_names }) {
    const defaultLat = tenant_location?.lat || -8.650000;
    const defaultLng = tenant_location?.lng || 115.220000;

    const { data, setData, put, processing, errors } = useForm({
        name: hydrant.name || '', 
        address: hydrant.address || '', 
        status: hydrant.status || 'Aktif', 
        type: hydrant.type || 'Stick', 
        description: hydrant.description || '', 
        lat: parseFloat(hydrant.lat) || defaultLat, 
        lng: parseFloat(hydrant.lng) || defaultLng,
        province_code: hydrant_province || admin_level?.province_code || '', 
        city_code: hydrant.city_code || admin_level?.city_code || '',
        district_code: hydrant.district_code || admin_level?.district_code || '',
        village_code: hydrant.village_code || admin_level?.village_code || ''
    });

    const onHandleChange = (e) => setData(e.target.name, e.target.value);

    // UX Peningkatan: Tampilkan nama bawaan aset saat pertama kali dibuka
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const [dynamicCities, setDynamicCities] = useState(cities || []);
    const [dynamicDistricts, setDynamicDistricts] = useState(districts || []);
    const [villages, setVillages] = useState([]);

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    
    // Mulai dengan 'true' agar teks nama bawaan hydrant tidak memicu hit API saat load awal
    const skipSearchRef = useRef(true);

    // Effect Jalur Yurisdiksi Berantai
    useEffect(() => {
        if (!admin_level?.city_code && data.province_code) {
            fetch(`/api/regions/cities/${data.province_code}`).then(res => res.json()).then(resData => setDynamicCities(resData));
        }
    }, [data.province_code, admin_level?.city_code]);

    useEffect(() => {
        if (!admin_level?.city_code && data.city_code) {
            fetch(`/api/regions/districts/${data.city_code}`).then(res => res.json()).then(resData => setDynamicDistricts(resData));
        }
    }, [data.city_code, admin_level?.city_code]);

    useEffect(() => {
        if (data.district_code && !admin_level?.village_code) {
            fetch(`/api/regions/villages/${data.district_code}`).then(res => res.json()).then(resData => setVillages(resData));
        }
    }, [data.district_code, admin_level?.village_code]);

    // Inisialisasi Peta Spasial
    useEffect(() => {
        if (!window.L || mapInstanceRef.current) return;
        mapInstanceRef.current = window.L.map(mapRef.current, { zoomControl: false }).setView([data.lat, data.lng], 16);
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapInstanceRef.current);
        window.L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);

        const customIcon = window.L.divIcon({
            html: `<div class="text-teal-600"><svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="currentColor"><path d="M18.364 17.364L12 23.728l-6.364-6.364a9 9 0 1 1 12.728 0zM12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg></div>`,
            className: 'bg-transparent border-none drop-shadow-md', iconSize: [42, 42], iconAnchor: [21, 42],
        });

        markerRef.current = window.L.marker([data.lat, data.lng], { icon: customIcon, draggable: true }).addTo(mapInstanceRef.current);
        
        markerRef.current.on('dragend', (e) => updateLocationData(e.target.getLatLng().lat, e.target.getLatLng().lng));
        mapInstanceRef.current.on('click', (e) => {
            markerRef.current.setLatLng(e.latlng);
            updateLocationData(e.latlng.lat, e.latlng.lng);
        });

        return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
    }, []);

    // FUNGSI AUTO-FILL DATA WILAYAH
    const updateLocationData = async (lat, lng, customSearchText = null) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=id`);
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
                    const validPart = parts.find(p => !p.toLowerCase().includes('no name') && !p.toLowerCase().includes('unnamed'));
                    searchBarText = validPart ? validPart.trim() : "Area Tanpa Nama";
                }
            }

            // Kunci ref dinyalakan sebelum merubah query pencarian
            skipSearchRef.current = true;
            setSearchQuery(searchBarText);

            // DETEKSI OTOMATIS YURISDIKSI (OMNI-SEARCH)
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
            setData(current => ({ ...current, lat: lat.toFixed(6), lng: lng.toFixed(6) })); 
        }
    };

    // DEBOUNCE HOOK PENCARIAN
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
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=4&accept-language=id`);
                setSearchResults(await response.json());
            } catch (error) { 
                console.error("Pencarian gagal", error); 
            } finally { 
                setIsSearching(false); 
            }
        }, 1000);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // SELEKSI DI DROPDOWN HASIL CARI
    const selectSearchResult = (result) => {
        const lat = parseFloat(result.lat), lng = parseFloat(result.lon);
        if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 17);
            markerRef.current.setLatLng([lat, lng]);
        }
        
        const selectedName = result.name || result.display_name.split(',')[0];
        skipSearchRef.current = true;
        
        updateLocationData(lat, lng, selectedName);
        setSearchResults([]);
    };

    const onHandleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.hydrants.update', hydrant.id), { preserveScroll: true, preserveState: true, onSuccess: (page) => { 
            const flash = page.props.flash;
            if (flash?.success) toast.success(flash.success);
            else if (flash?.error) toast.error(flash.error);
        }});
    };

    // UX Labeling
    const getHelperText = () => {
        if (admin_level?.village_code) return "Wewenang Desa: Anda hanya dapat mengelola data di wilayah desa Anda. Yurisdiksi telah dikunci otomatis.";
        if (admin_level?.district_code) return "Wewenang Kecamatan: Anda dapat mengatur penempatan tingkat Kelurahan/Desa pada kecamatan Anda.";
        if (admin_level?.city_code) return "Wewenang Kabupaten/Kota: Anda dapat mengatur penempatan di tingkat Kecamatan hingga Desa.";
        if (admin_level?.province_code) return "Wewenang Provinsi: Anda dapat mengatur penempatan di tingkat Kabupaten hingga Desa.";
        return "Wewenang Pusat: Anda memiliki akses penuh untuk mengatur seluruh yurisdiksi aset di Indonesia.";
    };

    const handleLockedClick = () => toast.error("Wewenang Terbatas: Anda tidak dapat mengubah data di luar yurisdiksi wilayah tugas Anda.");

    const LockedField = ({ label, value }) => (
        <div className="grid gap-1.5 cursor-not-allowed" onClick={handleLockedClick}>
            <Label className="text-muted-foreground">{label}</Label>
            <div className="relative pointer-events-none">
                <Input readOnly value={value || 'Memuat...'} className="pr-10 font-medium border-dashed shadow-none bg-accent/50 text-muted-foreground focus-visible:ring-0" />
                <IconLock className="absolute w-4 h-4 -translate-y-1/2 opacity-50 right-3 top-1/2 text-muted-foreground" />
            </div>
        </div>
    );

    return (
        <div className="flex flex-col w-full h-full space-y-6">
            <Head title={`Modifikasi Aset: ${hydrant.name}`} />
            
            <div className="flex flex-col items-start justify-between mb-2 gap-y-4 lg:flex-row lg:items-center">
                <HeaderTitle title="Modifikasi Data Hydrant" subtitle="Perbarui teknis, yurisdiksi, atau re-posisi titik aset." icon={IconDroplet} />
                <Button variant="secondary" size="sm" asChild><Link href={route('admin.hydrants.index')}><IconArrowLeft className="size-4 mr-1.5" /> Kembali</Link></Button>
            </div>

            <div className="flex flex-col items-start w-full gap-5 lg:flex-row lg:gap-6">
                <div className="flex flex-col w-full gap-5 shrink-0 lg:w-5/12 xl:w-1/3">
                    <Card className="shadow-none border-border">
                        <CardContent className="p-6">
                            <form className="space-y-5" onSubmit={onHandleSubmit}>
                                
                                <div className="flex items-start gap-3 p-3 text-teal-700 border border-teal-100 rounded-md bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900">
                                    <IconInfoCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p className="text-xs font-medium leading-relaxed">{getHelperText()}</p>
                                </div>

                                {/* PENCARIAN PETA MODERN DEBOUNCE ASYNC */}
                                <div className="grid gap-1.5 relative">
                                    <Label>
                                        Cari Lokasi di Peta 
                                        <span className="text-muted-foreground font-normal text-[11px] ml-1">(Ketik min. 3 huruf)</span>
                                    </Label>
                                    
                                    <div className="relative w-full">
                                        <IconSearch className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-3 top-1/2 text-muted-foreground" />
                                        <Input 
                                            value={searchQuery} 
                                            onChange={(e) => setSearchQuery(e.target.value)} 
                                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} 
                                            placeholder="Ketik jalan atau desa..." 
                                            className="w-full pr-10 shadow-sm pl-9 h-9 focus-visible:ring-teal-500" 
                                        />
                                        {isSearching && (
                                            <div className="absolute flex items-center justify-center -translate-y-1/2 pointer-events-none right-3 top-1/2">
                                                <IconLoader2 className="w-4 h-4 text-teal-600 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground border rounded-lg shadow-xl max-h-48 overflow-y-auto z-[999]">
                                            {searchResults.map((res, idx) => (
                                                <button 
                                                    key={idx} 
                                                    type="button" 
                                                    onClick={() => selectSearchResult(res)} 
                                                    className="w-full text-left px-3 py-2.5 hover:bg-accent border-b border-border last:border-0 text-xs flex gap-2 transition-colors"
                                                >
                                                    <IconCurrentLocation className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold truncate">{res.name || res.display_name.split(',')[0]}</p>
                                                        <p className="text-muted-foreground truncate mt-0.5">{res.display_name}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-4 p-4 border rounded-lg bg-accent/30 border-border">
                                    <h4 className="flex items-center justify-between text-xs font-bold uppercase text-muted-foreground">
                                        Area Yurisdiksi <span className="text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400 px-2 py-0.5 rounded-full">Auto-detected</span>
                                    </h4>
                                    
                                    <div className="grid gap-1.5">
                                        {admin_level?.province_code ? <LockedField label="Provinsi" value={admin_region_names?.province} /> : 
                                            <><Label>Provinsi</Label><Combobox items={provinces} value={data.province_code} onChange={(val) => setData(prev => ({ ...prev, province_code: val, city_code: '', district_code: '', village_code: '' }))} placeholder="Pilih Provinsi..." /></>}
                                    </div>

                                    <div className="grid gap-1.5">
                                        {admin_level?.city_code ? <LockedField label="Kabupaten / Kota" value={admin_region_names?.city} /> : 
                                            <><Label>Kabupaten / Kota</Label><Combobox items={dynamicCities} value={data.city_code} disabled={!data.province_code && !admin_level?.province_code} onChange={(val) => setData(prev => ({ ...prev, city_code: val, district_code: '', village_code: '' }))} placeholder="Pilih Kota/Kabupaten..." />{errors.city_code && <InputError message={errors.city_code} />}</>}
                                    </div>

                                    <div className="grid gap-1.5">
                                        {admin_level?.district_code ? <LockedField label="Kecamatan" value={admin_region_names?.district} /> : 
                                            <><Label>Kecamatan</Label><Combobox items={dynamicDistricts} value={data.district_code} disabled={!data.city_code && !admin_level?.city_code} onChange={(val) => setData(prev => ({ ...prev, district_code: val, village_code: '' }))} placeholder="Pilih Kecamatan..." />{errors.district_code && <InputError message={errors.district_code} />}</>}
                                    </div>

                                    <div className="grid gap-1.5">
                                        {admin_level?.village_code ? <LockedField label="Kelurahan / Desa" value={admin_region_names?.village} /> : 
                                            <><Label>Kelurahan / Desa</Label><Combobox items={villages} value={data.village_code} disabled={!data.district_code} onChange={(val) => setData('village_code', val)} placeholder="Pilih Desa/Kelurahan..." />{errors.village_code && <InputError message={errors.village_code} />}</>}
                                    </div>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="name">Nama Fasilitas</Label>
                                    <Input name="name" id="name" value={data.name} onChange={onHandleChange} className="focus-visible:ring-teal-500" />
                                    {errors.name && <InputError message={errors.name} />}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="address">Alamat Detail Lapangan</Label>
                                    <Textarea name="address" id="address" rows="2" value={data.address} onChange={onHandleChange} className="resize-none focus-visible:ring-teal-500" />
                                    {errors.address && <InputError message={errors.address} />}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-1.5">
                                        <Label>Jenis Konstruksi</Label>
                                        <Select defaultValue={data.type} onValueChange={(value) => setData('type', value)}><SelectTrigger className="focus-visible:ring-teal-500"><SelectValue placeholder="Pilih Jenis" /></SelectTrigger><SelectContent><SelectItem value="Stick">Stick</SelectItem><SelectItem value="Jongkok">Jongkok</SelectItem></SelectContent></Select>
                                        {errors.type && <InputError message={errors.type} />}
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Status Operasional</Label>
                                        <Select defaultValue={data.status} onValueChange={(value) => setData('status', value)}><SelectTrigger className="focus-visible:ring-teal-500"><SelectValue placeholder="Pilih Status" /></SelectTrigger><SelectContent><SelectItem value="Aktif">Kondisi Baik</SelectItem><SelectItem value="Perbaikan">Perbaikan</SelectItem></SelectContent></Select>
                                        {errors.status && <InputError message={errors.status} />}
                                    </div>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="description">Catatan (Opsional)</Label>
                                    <Input name="description" id="description" value={data.description} onChange={onHandleChange} className="focus-visible:ring-teal-500" />
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                                    <div className="grid gap-1.5"><Label className="flex items-center gap-1 text-muted-foreground"><IconLock className="w-3 h-3" /> Latitude</Label><Input readOnly value={data.lat} className="font-mono border-dashed shadow-none cursor-not-allowed bg-accent/50 border-input text-muted-foreground focus-visible:ring-0" /></div>
                                    <div className="grid gap-1.5"><Label className="flex items-center gap-1 text-muted-foreground"><IconLock className="w-3 h-3" /> Longitude</Label><Input readOnly value={data.lng} className="font-mono border-dashed shadow-none cursor-not-allowed bg-accent/50 border-input text-muted-foreground focus-visible:ring-0" /></div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="secondary" asChild><Link href={route('admin.hydrants.index')}>Batal</Link></Button>
                                    <Button type="submit" disabled={processing} className="text-white bg-teal-600 border-transparent shadow-none hover:bg-teal-700"><IconDeviceFloppy className="w-4 h-4 mr-2" /> Simpan Update</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col w-full h-[500px] lg:flex-1 lg:h-[calc(100vh-140px)] relative rounded-2xl overflow-hidden border bg-accent">
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
                        <div className="flex items-center gap-2 px-4 py-2 border rounded-full shadow-sm bg-background/80 backdrop-blur-md border-border">
                            <IconArrowsMove className="w-4 h-4 text-teal-600" />
                            <span className="text-xs font-medium text-foreground">Geser pin pada peta untuk koreksi akurasi</span>
                        </div>
                    </div>
                    <div ref={mapRef} className="z-0 w-full h-full"></div>
                </div>

            </div>
        </div>
    );
}

Edit.layout = (page) => <AppLayout children={page} title="Modifikasi Hydrant" />;