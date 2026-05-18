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

export default function Create(props) {
    const auth = props.auth.user;
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
        provinsi: '',
        kabupaten: '',
        kecamatan: '',
        desa: '',
        road: '',
        phone: auth?.phone || '',
        photo: null,
        _method: props.page_settings.method,
    });

    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ latitude, longitude });

                    try {
                        const response = await axios.get(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                        );

                        const addressData = response.data.address;

                        if (addressData) {
                            const roadName = addressData.road || addressData.street || addressData.pedestrian || '';
                            const villageName = addressData.village || addressData.suburb || '';
                            const districtName = addressData.city_district || addressData.district || '';

                            const displayAddr = [roadName, villageName, districtName].filter(Boolean).join(', ');
                            setFriendlyAddress(displayAddr || 'Lokasi terdeteksi');

                            setData((prevData) => ({
                                ...prevData,
                                lat: latitude,
                                lng: longitude,
                                provinsi: addressData.state || addressData.region || '',
                                kabupaten:
                                    addressData.city ||
                                    addressData.town ||
                                    addressData.county ||
                                    addressData.municipality ||
                                    '',
                                kecamatan: districtName,
                                desa: villageName,
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
                { enableHighAccuracy: true },
            );
        } else {
            toast.error('Browser Anda tidak mendukung deteksi lokasi.');
            setLocationLoading(false);
        }
    };

    const fallbackLocation = (latitude, longitude) => {
        setFriendlyAddress('Titik GPS terdeteksi');
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
                    {/* <HeaderTitle
                        title={props.page_settings.title}
                        subtitle={props.page_settings.subtitle}
                        icon={IconAlertTriangle}
                    /> */}
                    <Button
                        variant="outline"
                        className="h-9 px-4 rounded-md border-[#e5e5e5] bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-[#262626] dark:bg-[#151515] dark:text-gray-300 dark:hover:bg-[#1f1f1f] shadow-sm transition-colors"
                        asChild
                    >
                        <Link href={route('dashboard')}>
                            <IconArrowLeft className="w-4 h-4 mr-2" />
                            Batal
                        </Link>
                    </Button>
                </div>
                
                {/* Form Card */}
                <Card className="overflow-hidden rounded-xl border border-[#e5e5e5] shadow-sm bg-white dark:border-[#262626] dark:bg-[#151515]">
                    <CardHeader className="pb-5 border-b border-[#e5e5e5] dark:border-[#262626] bg-transparent">
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Kirim Laporan Darurat
                        </CardTitle>
                        <CardDescription className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Mohon lengkapi formulir di bawah agar relawan dapat segera membantu Anda.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-5 sm:p-6">
                        <form className="space-y-6" onSubmit={onHandleSubmit}>
                            
                            {/* --- BAGIAN LOKASI (Disederhanakan) --- */}
                            <div className="space-y-3">
                                {/* Header Lokasi & Status Digabung */}
                                <div className="flex items-center gap-3 pb-1 border-b border-[#e5e5e5] dark:border-[#262626]">
                                    {locationLoading ? (
                                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-50 text-blue-600 dark:bg-[#111e36] dark:text-blue-500 mb-2">
                                            <IconLoader2 className="w-4 h-4 animate-spin" />
                                        </div>
                                    ) : userLocation ? (
                                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-green-50 text-green-600 dark:bg-[#112a1d] dark:text-green-500 mb-2">
                                            <IconMapPinFilled className="w-4 h-4" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-red-50 text-[#b42826] dark:bg-[#2a1313] dark:text-[#e54845] mb-2">
                                            <IconAlertTriangle className="w-4 h-4" />
                                        </div>
                                    )}
                                    
                                    <div className="flex-1 min-w-0 pb-2">
                                        <p className="text-sm font-semibold tracking-wide text-gray-900 uppercase dark:text-gray-100">
                                            {locationLoading
                                                ? 'Mencari Koordinat...'
                                                : userLocation
                                                    ? 'Lokasi Terdeteksi'
                                                    : 'GPS Tidak Aktif'}
                                        </p>
                                        {friendlyAddress && !locationLoading && (
                                            <p className="text-[13px] text-gray-500 truncate dark:text-gray-400 mt-0.5">
                                                {friendlyAddress}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Peta */}
                                <div className="relative z-0 h-[200px] w-full overflow-hidden rounded-md border border-[#e5e5e5] bg-gray-50 shadow-inner dark:border-[#333] dark:bg-[#101010] sm:h-[250px]">
                                    <UserLeafletMap lat={data.lat} lng={data.lng} />
                                </div>

                                {/* Patokan Manual */}
                                <div className="pt-2">
                                    <Label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Detail Patokan Lokasi 
                                    </Label>
                                    <Input
                                        name="address"
                                        id="address"
                                        value={data.address}
                                        onChange={onHandleChange}
                                        className="h-10 mt-1.5 rounded-md border-[#e5e5e5] bg-white focus-visible:ring-1 focus-visible:ring-[#b42826] dark:border-[#333] dark:bg-[#101010] dark:text-gray-100"
                                        placeholder="Contoh: Samping warung cat biru, gang buntu..."
                                    />
                                    {errors.address && <InputError message={errors.address} className="mt-1" />}
                                </div>

                                {/* Data Administratif (Hidden) */}
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
                                <h3 className="pb-2 text-xs font-semibold tracking-wider text-gray-900 uppercase border-b border-[#e5e5e5] dark:border-[#262626] dark:text-gray-100">
                                    Informasi Laporan
                                </h3>

                                <div>
                                    <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">Apa yang terjadi?</Label>
                                    <Input
                                        name="title"
                                        id="title"
                                        value={data.title}
                                        type="text"
                                        placeholder="Contoh: Kebakaran Rumah, Pohon Tumbang..."
                                        onChange={onHandleChange}
                                        className="h-10 mt-1.5 rounded-md border-[#e5e5e5] bg-white focus-visible:ring-1 focus-visible:ring-[#b42826] dark:border-[#333] dark:bg-[#101010] dark:text-gray-100"
                                    />
                                    {errors.title && <InputError message={errors.title} className="mt-1" />}
                                </div>

                                <div>
                                    <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Detail Kejadian <span className="font-normal text-gray-400">(Opsional)</span>
                                    </Label>
                                    <Textarea
                                        name="description"
                                        id="description"
                                        value={data.description}
                                        placeholder="Jelaskan detail situasi saat ini jika memungkinkan..."
                                        onChange={onHandleChange}
                                        className="min-h-[100px] mt-1.5 resize-y rounded-md border-[#e5e5e5] bg-white p-3 text-sm focus-visible:ring-1 focus-visible:ring-[#b42826] dark:border-[#333] dark:bg-[#101010] dark:text-gray-100"
                                    />
                                    {errors.description && <InputError message={errors.description} className="mt-1" />}
                                </div>

                                {/* --- BAGIAN UPLOAD FOTO --- */}
                                <div className="pt-2">
                                    <div className="mb-3">
                                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Foto Bukti Kejadian</Label>
                                        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                                            Sertakan foto agar relawan dapat menilai skala prioritas.
                                        </p>
                                    </div>

                                    {previewUrl ? (
                                        <div className="relative w-full h-56 sm:h-64 rounded-md overflow-hidden border border-[#e5e5e5] dark:border-[#333] shadow-sm group">
                                            <img src={previewUrl} alt="Preview Bukti Kejadian" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                                            <div className="absolute inset-0 transition-colors bg-black/0 group-hover:bg-black/10"></div>
                                            <button
                                                type="button"
                                                onClick={removePhoto}
                                                className="absolute flex items-center justify-center w-8 h-8 text-red-600 transition-colors border border-transparent rounded-md shadow-sm top-3 right-3 bg-white/90 dark:bg-black/80 hover:bg-red-50 dark:text-red-400 backdrop-blur-sm hover:border-red-200 dark:hover:border-red-900/50"
                                                title="Hapus foto"
                                            >
                                                <IconX stroke={2.5} className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="border border-dashed border-[#e5e5e5] dark:border-[#333] rounded-md p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-[#101010] transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                                            <div className="w-12 h-12 bg-white dark:bg-[#151515] rounded-md flex items-center justify-center mb-4 border border-[#e5e5e5] dark:border-[#333] shadow-sm">
                                                <IconCloudUpload className="w-6 h-6 text-gray-600 dark:text-gray-400" stroke={1.5} />
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pilih foto kejadian</p>
                                            <p className="mt-1 mb-5 text-[13px] text-gray-500 dark:text-gray-400">Format PNG/JPG (Maks. 10MB)</p>
                                            
                                            <label className="cursor-pointer inline-flex items-center justify-center h-9 px-5 rounded-md bg-[#b42826] text-sm font-medium text-white hover:bg-[#9a2220] transition-colors focus-within:ring-2 focus-within:ring-[#b42826]/50">
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
                            <div className="pt-5 mt-5 border-t border-[#e5e5e5] dark:border-[#262626]">
                                <Button
                                    type="submit"
                                    className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#b42826] px-8 text-sm font-medium text-white transition-colors hover:bg-[#9a2220] focus-visible:ring-2 focus-visible:ring-[#b42826]/50 disabled:opacity-70 disabled:cursor-not-allowed"
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