import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import UserLeafletMap from '@/Components/UserLeafletMap';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, useForm, usePage } from '@inertiajs/react';
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

export default function Create(props) {
    const auth = props.auth.user;
    
    // Pastikan Controller mengirim data 'provinces' agar sistem bisa memulai pencocokan
    const provinces = props.provinces || []; 

    const [userLocation, setUserLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(true);
    const [friendlyAddress, setFriendlyAddress] = useState('');
    
    const [previewUrl, setPreviewUrl] = useState(null);
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
        photo: null,
        _method: props.page_settings.method,
    });

    // AUTO DETECT LOKASI & YURISDIKSI SILENTLY
    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
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
                            let pCode = '', cCode = '', dCode = '', vCode = '';
                            
                            const rawOsmNames = [
                                addr.state, addr.region, addr.city, addr.county, addr.regency, 
                                addr.town, addr.city_district, addr.municipality, addr.district, 
                                addr.suburb, addr.village, addr.neighbourhood, addr.hamlet
                            ];
                            const osmNames = rawOsmNames.filter(n => n && !n.toLowerCase().includes('no name'));
                            const removeWords = ['provinsi', 'prov', 'kota', 'kabupaten', 'kab', 'kecamatan', 'kec', 'kelurahan', 'desa'];

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
                },
                (error) => {
                    console.error('Error getting user location:', error);
                    toast.error('Gagal melacak lokasi akurat. Pastikan GPS aktif.');
                    setLocationLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }, // Optimalisasi GPS Darurat
            );
        } else {
            toast.error('Browser Anda tidak mendukung deteksi lokasi.');
            setLocationLoading(false);
        }
    };

    const fallbackLocation = (latitude, longitude) => {
        setFriendlyAddress('Titik GPS terdeteksi (Mode Darurat)');
        setData((prevData) => ({
            ...prevData,
            lat: latitude,
            lng: longitude,
        }));
    };

    useEffect(() => {
        getUserLocation();
        
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, []);

    const onHandleChange = (e) => setData(e.target.name, e.target.value);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('photo', file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removePhoto = () => {
        setData('photo', null);
        setPreviewUrl(null);
        if (fileInputPhoto.current) {
            fileInputPhoto.current.value = '';
        }
    };

    const onHandleSubmit = (e) => {
        e.preventDefault();

        if ((!data.lat || !data.lng) && !data.address) {
            toast.warning('Lokasi gagal dilacak, mohon isi Detail Patokan Lokasi secara manual.');
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
            <div className="flex flex-col w-full max-w-3xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
                    <Button
                        variant="outline"
                        className="h-9 px-4 rounded-md border-border bg-card text-sm font-medium text-foreground hover:bg-accent shadow-sm transition-colors"
                        asChild
                    >
                        <Link href={route('dashboard')}>
                            <IconArrowLeft className="w-4 h-4 mr-2" />
                            Batal
                        </Link>
                    </Button>
                </div>
                
                {/* Form Card */}
                <Card className="overflow-hidden rounded-xl border border-border shadow-sm bg-card">
                    <CardHeader className="pb-5 border-b border-border bg-transparent">
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Kirim Laporan Darurat
                        </CardTitle>
                        <CardDescription className="mt-1 text-sm text-muted-foreground">
                            Mohon lengkapi formulir di bawah agar relawan dapat segera membantu Anda.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-5 sm:p-6">
                        <form className="space-y-6" onSubmit={onHandleSubmit}>
                            
                            {/* --- BAGIAN LOKASI --- */}
                            <div className="space-y-3">
                                {/* Header Lokasi & Status Digabung */}
                                <div className="flex items-center gap-3 pb-1 border-b border-border">
                                    {locationLoading ? (
                                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-50 dark:bg-info/10 text-blue-600 dark:text-info mb-2">
                                            <IconLoader2 className="w-4 h-4 animate-spin" />
                                        </div>
                                    ) : userLocation ? (
                                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-green-50 dark:bg-success/10 text-green-600 dark:text-success mb-2">
                                            <IconMapPinFilled className="w-4 h-4" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-destructive/10 text-destructive mb-2">
                                            <IconAlertTriangle className="w-4 h-4" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0 pb-2">
                                        <p className="text-sm font-semibold tracking-wide text-foreground uppercase">
                                            {locationLoading
                                                ? 'Memindai Koordinat...'
                                                : userLocation
                                                    ? 'Lokasi Terdeteksi'
                                                    : 'GPS Tidak Aktif'}
                                        </p>
                                        {friendlyAddress && !locationLoading && (
                                            <p className="text-[13px] text-muted-foreground truncate mt-0.5">
                                                {friendlyAddress}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Peta */}
                                <div className="relative z-0 h-[200px] w-full overflow-hidden rounded-md border border-border bg-muted shadow-inner sm:h-[250px]">
                                    <UserLeafletMap lat={data.lat} lng={data.lng} />
                                </div>

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
                                        className="h-10 mt-1.5 rounded-md border-border bg-card focus-visible:ring-1 focus-visible:ring-destructive"
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
                            <div className="pt-2 space-y-4">
                                <h3 className="pb-2 text-xs font-semibold tracking-wider text-foreground uppercase border-b border-border">
                                    Informasi Laporan
                                </h3>

                                <div>
                                    <Label htmlFor="title" className="text-sm font-medium text-foreground/80">Apa yang terjadi?</Label>
                                    <Input
                                        name="title"
                                        id="title"
                                        value={data.title}
                                        type="text"
                                        placeholder="Contoh: Kebakaran Rumah, Pohon Tumbang..."
                                        onChange={onHandleChange}
                                        className="h-10 mt-1.5 rounded-md border-border bg-card focus-visible:ring-1 focus-visible:ring-destructive"
                                    />
                                    {errors.title && <InputError message={errors.title} className="mt-1" />}
                                </div>

                                <div>
                                    <Label htmlFor="description" className="text-sm font-medium text-foreground/80">
                                        Detail Kejadian <span className="font-normal text-muted-foreground">(Opsional)</span>
                                    </Label>
                                    <Textarea
                                        name="description"
                                        id="description"
                                        value={data.description}
                                        placeholder="Jelaskan detail situasi saat ini jika memungkinkan..."
                                        onChange={onHandleChange}
                                        className="min-h-[100px] mt-1.5 resize-y rounded-md border-border bg-card p-3 text-sm focus-visible:ring-1 focus-visible:ring-destructive"
                                    />
                                    {errors.description && <InputError message={errors.description} className="mt-1" />}
                                </div>

                                {/* --- BAGIAN UPLOAD FOTO --- */}
                                <div className="pt-2">
                                    <div className="mb-3">
                                        <Label className="text-sm font-medium text-foreground/80">Foto Bukti Kejadian</Label>
                                        <p className="text-[13px] text-muted-foreground mt-0.5">
                                            Sertakan foto agar relawan dapat menilai skala prioritas.
                                        </p>
                                    </div>

                                    {previewUrl ? (
                                        <div className="relative w-full h-56 sm:h-64 rounded-md overflow-hidden border border-border shadow-sm group">
                                            <img src={previewUrl} alt="Preview Bukti Kejadian" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                                            <div className="absolute inset-0 transition-colors bg-black/0 group-hover:bg-black/10"></div>
                                            <button
                                                type="button"
                                                onClick={removePhoto}
                                                className="absolute flex items-center justify-center w-8 h-8 text-red-600 dark:text-destructive transition-colors border border-transparent rounded-md shadow-sm top-3 right-3 bg-card/90 hover:bg-red-50 dark:hover:bg-destructive/10 backdrop-blur-sm hover:border-red-200 dark:hover:border-destructive/30"
                                                title="Hapus foto"
                                            >
                                                <IconX stroke={2.5} className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="border border-dashed border-border rounded-md p-8 flex flex-col items-center justify-center text-center bg-muted/50 transition-colors hover:bg-muted">
                                            <div className="w-12 h-12 bg-card rounded-md flex items-center justify-center mb-4 border border-border shadow-sm">
                                                <IconCloudUpload className="w-6 h-6 text-muted-foreground" stroke={1.5} />
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">Pilih foto kejadian</p>
                                            <p className="mt-1 mb-5 text-[13px] text-muted-foreground">Format PNG/JPG (Maks. 10MB)</p>

                                            <label className="cursor-pointer inline-flex items-center justify-center h-9 px-5 rounded-md bg-destructive text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors focus-within:ring-2 focus-within:ring-destructive/50">
                                                Jelajahi File
                                                <input
                                                    name="photo"
                                                    id="photo"
                                                    type="file"
                                                    accept="image/*"
                                                    ref={fileInputPhoto}
                                                    onChange={handlePhotoChange}
                                                    className="sr-only"
                                                />
                                            </label>
                                        </div>
                                    )}
                                    {errors.photo && <InputError message={errors.photo} className="mt-1" />}
                                </div>
                            </div>

                            {/* --- ACTIONS --- */}
                            <div className="pt-5 mt-5 border-t border-border">
                                <Button
                                    type="submit"
                                    className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-destructive px-8 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50 disabled:opacity-70 disabled:cursor-not-allowed"
                                    disabled={processing || locationLoading}
                                >
                                    {processing ? (
                                        <IconLoader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <IconSend className="w-5 h-5" />
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