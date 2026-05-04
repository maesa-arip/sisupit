import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import UserLeafletMap from '@/Components/UserLeafletMap';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import { 
    IconArrowLeft, 
    IconAlertTriangle, 
    IconMapPinFilled, 
    IconLoader2,
    IconCamera,
    IconSend
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

export default function Create(props) {
    const auth = props.auth.user;
    const [userLocation, setUserLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(true);
    const [friendlyAddress, setFriendlyAddress] = useState(''); // State baru untuk alamat singkat
    const fileInputPhoto = useRef(null);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        address: '', // Ini sekarang kita pakai khusus untuk "Patokan"
        title: '',
        description: '',
        location_lat: '',
        location_lng: '',
        provinsi: '',  
        kabupaten: '', 
        kecamatan: '', 
        desa: '',      
        road: '',
        phone: '',
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
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                        );
                        
                        const addressData = response.data.address;
                        
                        if (addressData) {
                            const roadName = addressData.road || addressData.street || addressData.pedestrian || '';
                            const villageName = addressData.village || addressData.suburb || '';
                            const districtName = addressData.city_district || addressData.district || '';
                            
                            // Buat string alamat yang ramah dibaca untuk UI
                            const displayAddr = [roadName, villageName, districtName].filter(Boolean).join(', ');
                            setFriendlyAddress(displayAddr || 'Lokasi terdeteksi');

                            setData((prevData) => ({
                                ...prevData,
                                location_lat: latitude,
                                location_lng: longitude,
                                provinsi: addressData.state || addressData.region || '',
                                kabupaten: addressData.city || addressData.town || addressData.county || addressData.municipality || '',
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
                { enableHighAccuracy: true } 
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
    }, []);

    const onHandleChange = (e) => setData(e.target.name, e.target.value);

    const onHandleSubmit = (e) => {
        e.preventDefault();
        
        if (!data.location_lat || !data.location_lng) {
            toast.warning('Tunggu sebentar, lokasi Anda sedang dilacak.');
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

    // FUNGSI RESET DIHAPUS (Mencegah salah pencet saat panik)

    return (
        <div className="relative w-full pb-32">
            
            {/* REVISI: Latar Belakang Dekoratif menggunakan Merah (Darurat) */}
            <div className="absolute top-0 left-0 right-0 flex justify-center w-full pointer-events-none -z-10">
                <div className="w-[80vw] max-w-[600px] h-[250px] sm:h-[400px] bg-red-500/15 dark:bg-red-500/10 rounded-[100%] blur-[80px] sm:blur-[120px] -mt-10 sm:-mt-20"></div>
            </div>

            <div className="flex flex-col w-full max-w-3xl mx-auto space-y-6"> {/* max-w-3xl agar lebih terpusat */}
                
                {/* Header Section */}
                <div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
                    <HeaderTitle
                        title={props.page_settings.title}
                        subtitle={props.page_settings.subtitle}
                        icon={IconAlertTriangle} 
                    />
                    <Button variant="outline" className="border-gray-300 shadow-sm rounded-xl dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-slate-800" asChild>
                        <Link href={route('dashboard')}>
                            <IconArrowLeft className="w-4 h-4 mr-2" />
                            Batal
                        </Link>
                    </Button>
                </div>

                {/* Form Card */}
                <Card className="overflow-hidden border-gray-200 dark:border-slate-800 shadow-xl rounded-[24px]">
                    <CardHeader className="pb-6 border-b border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/20">
                        <CardTitle className="text-xl text-red-700 dark:text-red-500">Kirim Laporan Darurat</CardTitle>
                        <CardDescription className="dark:text-slate-400">
                            Lokasi Anda dilacak secara otomatis. Silakan lengkapi detail kejadian di bawah.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 sm:p-8">
                        <form className="space-y-8" onSubmit={onHandleSubmit}>
                            
                            {/* --- BAGIAN LOKASI (Disederhanakan) --- */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 pb-2 text-sm font-bold tracking-wider text-gray-900 uppercase border-b border-gray-100 dark:text-slate-100 dark:border-slate-800">
                                    <IconMapPinFilled className="w-5 h-5 text-red-500" />
                                    Deteksi Lokasi
                                </h3>
                                
                                {/* Indikator Status Lokasi Minimalis */}
                                <div className="flex flex-col p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700/80 rounded-[20px] shadow-sm gap-4">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-3">
                                            {locationLoading ? (
                                                <IconLoader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                            ) : userLocation ? (
                                                <span className="flex items-center justify-center w-8 h-8 text-green-600 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-400">
                                                    <IconMapPinFilled className="w-4 h-4" />
                                                </span>
                                            ) : (
                                                <IconAlertTriangle className="w-5 h-5 text-red-500" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 dark:text-slate-100">
                                                    {locationLoading ? 'Mencari satelit GPS...' : userLocation ? 'Satelit Terkunci' : 'Gagal melacak lokasi'}
                                                </p>
                                                {friendlyAddress && (
                                                    <p className="text-xs text-gray-500 truncate dark:text-slate-400">
                                                        {friendlyAddress}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Map Display */}
                                    <div className="w-full h-[180px] sm:h-[220px] rounded-[14px] overflow-hidden relative z-0 border border-gray-100 dark:border-slate-800 shadow-inner bg-gray-50 dark:bg-slate-800">
                                        <UserLeafletMap />
                                    </div>
                                </div>

                                {/* Input Patokan Manual */}
                                <div className="space-y-1.5 pt-2">
                                    <Label htmlFor="address">Detail Patokan Lokasi <span className="font-normal text-gray-400">(Opsional tapi disarankan)</span></Label>
                                    <Input 
                                        name="address" id="address" value={data.address} onChange={onHandleChange} 
                                        className="text-sm border-gray-200 h-11 bg-gray-50 dark:bg-slate-800/50 dark:border-slate-700 focus-visible:ring-red-500" 
                                        placeholder="Contoh: Samping warung cat biru, gang buntu..."
                                    />
                                    {errors.address && <InputError message={errors.address} />}
                                </div>

                                {/* REVISI: Data Administratif Disembunyikan sepenuhnya! */}
                                <input type="hidden" name="location_lat" value={data.location_lat} />
                                <input type="hidden" name="location_lng" value={data.location_lng} />
                                <input type="hidden" name="provinsi" value={data.provinsi} />
                                <input type="hidden" name="kabupaten" value={data.kabupaten} />
                                <input type="hidden" name="kecamatan" value={data.kecamatan} />
                                <input type="hidden" name="desa" value={data.desa} />
                                <input type="hidden" name="road" value={data.road} />
                            </div>

                            {/* --- BAGIAN FORM INFORMASI --- */}
                            <div className="pt-4 space-y-5">
                                <h3 className="pb-2 text-sm font-bold tracking-wider text-gray-900 uppercase border-b border-gray-100 dark:text-slate-100 dark:border-slate-800">
                                    Informasi Laporan
                                </h3>

                                <div className="space-y-2">
                                    <Label htmlFor="title">Apa yang terjadi?</Label>
                                    <Input
                                        name="title" id="title" value={data.title} type="text"
                                        placeholder="Contoh: Kebakaran Rumah, Pohon Tumbang..."
                                        onChange={onHandleChange}
                                        className="h-12 border-gray-300 rounded-xl focus-visible:ring-red-500 dark:bg-slate-900"
                                    />
                                    {errors.title && <InputError message={errors.title} />}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Detail Kejadian <span className="font-normal text-gray-400">(Opsional)</span></Label>
                                    <Textarea
                                        name="description" id="description" value={data.description}
                                        placeholder="Jelaskan detail situasi saat ini jika memungkinkan..."
                                        onChange={onHandleChange}
                                        className="min-h-[100px] rounded-xl focus-visible:ring-red-500 dark:bg-slate-900 resize-y"
                                    />
                                    {errors.description && <InputError message={errors.description} />}
                                </div>

                                <div className="pt-2 space-y-2">
                                    <Label htmlFor="photo" className="flex items-center gap-2">
                                        <IconCamera className="w-5 h-5 text-gray-500" /> Foto Bukti Kejadian
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            name="photo" id="photo" type="file" accept="image/*"
                                            ref={fileInputPhoto}
                                            onChange={(e) => setData(e.target.name, e.target.files[0])}
                                            className="h-12 pt-2.5 rounded-xl cursor-pointer file:cursor-pointer file:bg-gray-100 file:text-gray-700 file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:font-bold file:text-xs dark:file:bg-slate-800 dark:file:text-slate-300 focus-visible:ring-red-500 dark:bg-slate-900 border-gray-300"
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-500">*Sertakan foto agar relawan dapat menilai skala prioritas.</p>
                                    {errors.photo && <InputError message={errors.photo} />}
                                </div>
                            </div>

                            {/* --- ACTIONS (Lebih aman dan tegas) --- */}
                            <div className="pt-6 mt-6 border-t border-gray-100 dark:border-slate-800">
                                <Button 
                                    type="submit" 
                                    className="flex items-center justify-center w-full h-14 gap-2 px-8 font-extrabold text-white transition-all rounded-[16px] bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 text-lg" 
                                    disabled={processing || locationLoading}
                                >
                                    {processing ? <IconLoader2 className="w-6 h-6 animate-spin" /> : <IconSend className="w-6 h-6" />}
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