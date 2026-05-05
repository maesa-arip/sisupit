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
    
    // State baru untuk preview foto
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputPhoto = useRef(null);

    const { data, setData, post, processing, errors } = useForm({
        name: auth?.name || '',
        address: '', 
        title: '',
        description: '',
        location_lat: '',
        location_lng: '',
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
                                location_lat: latitude,
                                location_lng: longitude,
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
            location_lat: latitude,
            location_lng: longitude,
        }));
    };

    useEffect(() => {
        getUserLocation();
        
        // Cleanup function untuk URL preview gambar demi mencegah memory leak
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, []);

    const onHandleChange = (e) => setData(e.target.name, e.target.value);

    // Fungsi untuk menangani perubahan file foto & generate preview
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('photo', file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // Fungsi untuk menghapus foto yang sudah dipilih
    const removePhoto = () => {
        setData('photo', null);
        setPreviewUrl(null);
        if (fileInputPhoto.current) {
            fileInputPhoto.current.value = '';
        }
    };

    const onHandleSubmit = (e) => {
        e.preventDefault();

        if ((!data.location_lat || !data.location_lng) && !data.address) {
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
                    <HeaderTitle
                        title={props.page_settings.title}
                        subtitle={props.page_settings.subtitle}
                        icon={IconAlertTriangle}
                    />
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
                            Lokasi Anda dilacak secara otomatis. Silakan lengkapi detail kejadian di bawah.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-5 sm:p-6">
                        <form className="space-y-6" onSubmit={onHandleSubmit}>
                            
                            {/* --- BAGIAN LOKASI --- */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 pb-2 text-xs font-semibold tracking-wider text-gray-900 uppercase border-b border-[#e5e5e5] dark:border-[#262626] dark:text-gray-100">
                                    <IconMapPinFilled className="w-4 h-4 text-[#b42826] dark:text-[#e54845]" />
                                    Deteksi Lokasi
                                </h3>

                                <div className="flex flex-col gap-3 rounded-lg border border-[#e5e5e5] bg-gray-50 p-4 dark:border-[#262626] dark:bg-[#101010]">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-3">
                                            {locationLoading ? (
                                                <IconLoader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                            ) : userLocation ? (
                                                <span className="flex items-center justify-center w-8 h-8 text-green-600 bg-green-100/50 rounded-md dark:bg-[#112a1d] dark:text-green-500 border border-green-200 dark:border-green-900/50">
                                                    <IconMapPinFilled className="w-4 h-4" />
                                                </span>
                                            ) : (
                                                <IconAlertTriangle className="w-5 h-5 text-[#b42826] dark:text-[#e54845]" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    {locationLoading
                                                        ? 'Mencari satelit GPS...'
                                                        : userLocation
                                                            ? 'Satelit Terkunci'
                                                            : 'Gagal melacak lokasi'}
                                                </p>
                                                {friendlyAddress && (
                                                    <p className="text-xs text-gray-500 truncate dark:text-gray-400 mt-0.5">
                                                        {friendlyAddress}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Map Display */}
                                    <div className="relative z-0 h-[200px] w-full overflow-hidden rounded-md border border-[#e5e5e5] bg-white shadow-inner dark:border-[#262626] dark:bg-[#151515] sm:h-[300px]">
                                        <UserLeafletMap lat={data.location_lat} lng={data.location_lng} />
                                    </div>
                                </div>

                                {/* Input Patokan Manual */}
                                <div className="space-y-1.5 pt-2">
                                    <Label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Detail Patokan Lokasi <span className="font-normal text-gray-400">(Opsional)</span>
                                    </Label>
                                    <Input
                                        name="address"
                                        id="address"
                                        value={data.address}
                                        onChange={onHandleChange}
                                        className="h-10 rounded-md border-[#e5e5e5] bg-white focus-visible:ring-1 focus-visible:ring-[#b42826] dark:border-[#262626] dark:bg-[#151515] dark:text-gray-100"
                                        placeholder="Contoh: Samping warung cat biru, gang buntu..."
                                    />
                                    {errors.address && <InputError message={errors.address} />}
                                </div>

                                {/* Data Administratif (Hidden) */}
                                <input type="hidden" name="location_lat" value={data.location_lat} />
                                <input type="hidden" name="location_lng" value={data.location_lng} />
                                <input type="hidden" name="provinsi" value={data.provinsi} />
                                <input type="hidden" name="kabupaten" value={data.kabupaten} />
                                <input type="hidden" name="kecamatan" value={data.kecamatan} />
                                <input type="hidden" name="desa" value={data.desa} />
                                <input type="hidden" name="road" value={data.road} />
                            </div>

                            {/* --- BAGIAN FORM INFORMASI --- */}
                            <div className="pt-2 space-y-4">
                                <h3 className="pb-2 text-xs font-semibold tracking-wider text-gray-900 uppercase border-b border-[#e5e5e5] dark:border-[#262626] dark:text-gray-100">
                                    Informasi Laporan
                                </h3>

                                <div className="space-y-1.5">
                                    <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">Apa yang terjadi?</Label>
                                    <Input
                                        name="title"
                                        id="title"
                                        value={data.title}
                                        type="text"
                                        placeholder="Contoh: Kebakaran Rumah, Pohon Tumbang..."
                                        onChange={onHandleChange}
                                        className="h-10 rounded-md border-[#e5e5e5] bg-white focus-visible:ring-1 focus-visible:ring-[#b42826] dark:border-[#262626] dark:bg-[#151515] dark:text-gray-100"
                                    />
                                    {errors.title && <InputError message={errors.title} />}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Detail Kejadian <span className="font-normal text-gray-400">(Opsional)</span>
                                    </Label>
                                    <Textarea
                                        name="description"
                                        id="description"
                                        value={data.description}
                                        placeholder="Jelaskan detail situasi saat ini jika memungkinkan..."
                                        onChange={onHandleChange}
                                        className="min-h-[100px] resize-y rounded-md border-[#e5e5e5] bg-white p-3 text-sm focus-visible:ring-1 focus-visible:ring-[#b42826] dark:border-[#262626] dark:bg-[#151515] dark:text-gray-100"
                                    />
                                    {errors.description && <InputError message={errors.description} />}
                                </div>

                                {/* --- REVISI: BAGIAN UPLOAD FOTO --- */}
                                <div className="pt-2 space-y-3">
                                    <div>
                                        <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">Foto Bukti Kejadian</Label>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                            Sertakan foto agar relawan dapat menilai skala prioritas.
                                        </p>
                                    </div>

                                    {previewUrl ? (
                                        /* Tampilan Preview Foto */
                                        <div className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden border border-[#e5e5e5] dark:border-[#262626] shadow-sm group">
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
                                        /* Tampilan Upload (Sesuai Gambar Referensi) */
                                        <div className="border border-dashed border-[#e5e5e5] dark:border-[#333] rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-[#101010] transition-colors hover:bg-gray-50 dark:hover:bg-[#151515]">
                                            <div className="w-12 h-12 bg-gray-100 dark:bg-[#1f1f1f] rounded-xl flex items-center justify-center mb-4 border border-gray-200 dark:border-[#262626]">
                                                <IconCloudUpload className="w-6 h-6 text-gray-900 dark:text-gray-100" stroke={1.5} />
                                            </div>
                                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Upload files</p>
                                            <p className="mt-1 mb-5 text-sm text-gray-500 dark:text-gray-400">PNG, JPG up to 10MB</p>
                                            
                                            <label className="cursor-pointer inline-flex items-center justify-center h-10 px-5 rounded-md bg-[#b42826] text-sm font-medium text-white hover:bg-[#9a2220] transition-colors focus-within:ring-2 focus-within:ring-[#b42826]/50">
                                                Browse Files
                                                <input
                                                    name="photo"
                                                    id="photo"
                                                    type="file"
                                                    accept="image/*"
                                                    ref={fileInputPhoto}
                                                    onChange={handlePhotoChange}
                                                    className="sr-only" // Menyembunyikan input asli
                                                />
                                            </label>
                                        </div>
                                    )}
                                    {errors.photo && <InputError message={errors.photo} />}
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