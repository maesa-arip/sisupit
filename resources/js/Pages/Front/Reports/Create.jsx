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

export default function Create(props) {
    const auth = props.auth.user;
    const [userLocation, setUserLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(true);

    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ latitude, longitude });
                    setLocationLoading(false);
                },
                (error) => {
                    console.error('Error getting user location:', error);
                    toast.error('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
                    setLocationLoading(false);
                },
                { enableHighAccuracy: true } // Meminta akurasi tinggi untuk laporan darurat
            );
        } else {
            console.error('Geolocation is not supported by this browser.');
            setLocationLoading(false);
        }
    };

    useEffect(() => {
        getUserLocation();
    }, []);

    const fileInputPhoto = useRef(null);
    const { data, setData, reset, post, processing, errors } = useForm({
        name: '',
        address: '',
        title: '',
        description: '',
        location_lat: '',
        location_lng: '',
        phone: '',
        photo: null,
        _method: props.page_settings.method,
    });

    useEffect(() => {
        if (userLocation) {
            setData((prevData) => ({
                ...prevData,
                location_lat: userLocation.latitude,
                location_lng: userLocation.longitude
            }));
        }
    }, [userLocation]);

    const onHandleChange = (e) => setData(e.target.name, e.target.value);

    const onHandleSubmit = (e) => {
        e.preventDefault();
        
        if (!data.location_lat || !data.location_lng) {
            toast.warning('Tunggu sebentar, lokasi Anda belum terdeteksi.');
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

    const onHandleReset = () => {
        reset();
        if (fileInputPhoto.current) {
            fileInputPhoto.current.value = null;
        }
        // Kembalikan koordinat yang sudah didapat
        if (userLocation) {
            setData('location_lat', userLocation.latitude);
            setData('location_lng', userLocation.longitude);
        }
    };

    return (
        <div className="relative w-full pb-32">
            
            {/* Latar Belakang Dekoratif Ambient Amber */}
            {/* <div className="absolute inset-x-0 top-0 h-[400px] overflow-hidden pointer-events-none -z-10">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[100px]"></div>
            </div> */}
			{/* Latar Belakang Dekoratif Ambient Amber (Glow Bulat Sempurna) */}
            <div className="absolute top-0 left-0 right-0 flex justify-center w-full pointer-events-none -z-10">
                <div className="w-[80vw] max-w-[600px] h-[250px] sm:h-[400px] bg-amber-500/20 dark:bg-amber-500/10 rounded-[100%] blur-[80px] sm:blur-[120px] -mt-10 sm:-mt-20"></div>
            </div>

            <div className="flex flex-col w-full max-w-4xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
                    <HeaderTitle
                        title={props.page_settings.title}
                        subtitle={props.page_settings.subtitle}
                        icon={IconAlertTriangle} // Menggunakan icon Alert karena ini konteks Laporan Darurat
                    />
                    <Button variant="outline" className="border-gray-300 shadow-sm rounded-xl dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-slate-800" asChild>
                        <Link href={route('dashboard')}>
                            <IconArrowLeft className="w-4 h-4 mr-2" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                {/* Form Card */}
                <Card className="overflow-hidden border-gray-200 dark:border-slate-800 shadow-lg rounded-[28px]">
                    <CardHeader className="pb-6 border-b bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20">
                        <CardTitle className="text-xl text-amber-800 dark:text-amber-500">Detail Kejadian</CardTitle>
                        <CardDescription className="dark:text-slate-400">
                            Mohon lengkapi data laporan di bawah ini dengan jelas agar petugas dapat merespons dengan cepat.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 sm:p-8">
                        <form className="space-y-8" onSubmit={onHandleSubmit}>
                            
                            {/* --- BAGIAN LOKASI --- */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 pb-2 text-sm font-bold tracking-wider text-gray-900 uppercase border-b border-gray-100 dark:text-slate-100 dark:border-slate-800">
                                    <IconMapPinFilled className="w-5 h-5 text-amber-500" />
                                    Titik Koordinat Lokasi
                                </h3>
                                
                                {/* Indikator Status Lokasi */}
                                <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
                                    locationLoading 
                                        ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-blue-400' 
                                        : userLocation 
                                            ? 'bg-green-50 border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-900/30 dark:text-green-400'
                                            : 'bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400'
                                }`}>
                                    {locationLoading ? (
                                        <IconLoader2 className="w-5 h-5 animate-spin shrink-0" />
                                    ) : userLocation ? (
                                        <IconMapPinFilled className="w-5 h-5 shrink-0" />
                                    ) : (
                                        <IconAlertTriangle className="w-5 h-5 shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold">
                                            {locationLoading ? 'Mencari lokasi terkini Anda...' : userLocation ? 'Lokasi berhasil didapatkan' : 'Gagal melacak lokasi'}
                                        </p>
                                        {userLocation && (
                                            <p className="text-xs truncate opacity-80">
                                                Lat: {userLocation.latitude}, Lng: {userLocation.longitude}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                

{/* Map Component Wrapper yang Baru & Elegan */}
                                <div className="flex flex-col p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700/80 rounded-[28px] shadow-sm">
                                    
                                    {/* Header Peta */}
                                    <div className="flex items-center justify-between px-1 mb-3">
                                        <span className="text-sm font-bold text-gray-800 dark:text-slate-200">
                                            Peta Lokasi Anda
                                        </span>
                                        <span className="flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                        </span>
                                    </div>
                                    
                                    {/* Wadah Peta */}
                                    {/* [&>div]:mt-0 ini untuk berjaga-jaga jika komponen UserLeafletMap punya margin bawaan */}
                                    <div className="w-full h-[220px] sm:h-[280px] rounded-[18px] overflow-hidden relative z-0 border border-gray-200 dark:border-slate-700/50 shadow-inner bg-gray-50 dark:bg-slate-800">
                                        <UserLeafletMap />
                                    </div>
                                    
                                </div>
                                {/* Hidden Inputs for Coordinates (Tetap ada untuk dikirim form tapi tidak merusak UI) */}
                                <input type="hidden" name="location_lat" value={data.location_lat} />
                                <input type="hidden" name="location_lng" value={data.location_lng} />
                            </div>

                            {/* --- BAGIAN FORM INFORMASI --- */}
                            <div className="pt-2 space-y-6">
                                <h3 className="pb-2 text-sm font-bold tracking-wider text-gray-900 uppercase border-b border-gray-100 dark:text-slate-100 dark:border-slate-800">
                                    Informasi Laporan
                                </h3>

                                <div className="space-y-2">
                                    <Label htmlFor="title">Judul Laporan</Label>
                                    <Input
                                        name="title"
                                        id="title"
                                        value={data.title}
                                        type="text"
                                        placeholder="Contoh: Kebakaran Rumah, Pohon Tumbang, dll..."
                                        onChange={onHandleChange}
                                        className="h-12 rounded-xl focus-visible:ring-amber-500 dark:bg-slate-900"
                                    />
                                    {errors.title && <InputError message={errors.title} />}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Deskripsi Kejadian <span className="font-normal text-gray-400">(Opsional)</span></Label>
                                    <Textarea
                                        name="description"
                                        id="description"
                                        value={data.description}
                                        placeholder="Jelaskan detail situasi kejadian saat ini..."
                                        onChange={onHandleChange}
                                        className="min-h-[100px] rounded-xl focus-visible:ring-amber-500 dark:bg-slate-900 resize-y"
                                    />
                                    {errors.description && <InputError message={errors.description} />}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Detail Patokan Alamat <span className="font-normal text-gray-400">(Opsional)</span></Label>
                                    <Textarea
                                        name="address"
                                        id="address"
                                        value={data.address}
                                        placeholder="Contoh: Di depan indomaret, sebelah rumah pagar biru..."
                                        onChange={onHandleChange}
                                        className="min-h-[80px] rounded-xl focus-visible:ring-amber-500 dark:bg-slate-900 resize-y"
                                    />
                                    <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-1">*Jika dikosongkan, petugas akan berpatokan pada titik GPS di atas.</p>
                                    {errors.address && <InputError message={errors.address} />}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="photo" className="flex items-center gap-2">
                                        <IconCamera className="w-4 h-4" /> Lampirkan Foto Bukti
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            name="photo"
                                            id="photo"
                                            type="file"
                                            accept="image/*"
                                            ref={fileInputPhoto}
                                            onChange={(e) => setData(e.target.name, e.target.files[0])}
                                            className="h-12 pt-2.5 rounded-xl cursor-pointer file:cursor-pointer file:bg-amber-100 file:text-amber-700 file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:font-bold file:text-xs dark:file:bg-amber-900/30 dark:file:text-amber-400 focus-visible:ring-amber-500 dark:bg-slate-900"
                                        />
                                    </div>
                                    {errors.photo && <InputError message={errors.photo} />}
                                </div>
                            </div>

                            {/* --- ACTIONS --- */}
                            <div className="flex flex-col-reverse justify-end gap-3 pt-6 mt-6 border-t border-gray-100 sm:flex-row dark:border-slate-800">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="w-full h-12 px-6 border-gray-300 rounded-xl dark:border-slate-700 sm:w-auto" 
                                    onClick={onHandleReset}
                                >
                                    Bersihkan Form
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="flex items-center w-full h-12 gap-2 px-8 font-bold text-white rounded-xl bg-amber-600 hover:bg-amber-700 sm:w-auto" 
                                    disabled={processing || locationLoading}
                                >
                                    {processing ? <IconLoader2 className="w-5 h-5 animate-spin" /> : <IconSend className="w-5 h-5" />}
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