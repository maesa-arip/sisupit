import HeaderTitle from '@/Components/HeaderTitle';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { useForm } from '@inertiajs/react';
import { 
    IconSearch, 
    IconMapPinFilled, 
    IconFiretruck, 
    IconPhoneCall,
    IconRadar,
    IconLoader2
} from '@tabler/icons-react';
import { useState } from 'react';
import UserLeafletMap from '@/Components/UserLeafletMap';

export default function Index({ stations, filters, ...props }) {
    const [isLocating, setIsLocating] = useState(false);

    const { data, setData, get, processing } = useForm({
        search: filters?.search || '',
        status: filters?.status || 'Semua',
        is_nearest: filters?.is_nearest || false,
        lat: filters?.lat || '',
        lng: filters?.lng || ''
    });

    const handleSearch = (e) => {
        e.preventDefault();
        get(route('front.fire_stations.index'), { preserveState: true, preserveScroll: true });
    };

    const handleNearestSearch = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    data.is_nearest = true;
                    data.lat = position.coords.latitude;
                    data.lng = position.coords.longitude;
                    get(route('front.fire_stations.index'), {
                        preserveState: true, preserveScroll: true,
                        onFinish: () => setIsLocating(false)
                    });
                },
                (error) => {
                    alert('Gagal mendapatkan lokasi. Pastikan izin GPS aktif.');
                    setIsLocating(false);
                }
            );
        } else {
            alert('Browser Anda tidak mendukung fitur lokasi.');
            setIsLocating(false);
        }
    };

    return (
        <div className="relative flex flex-col w-full pb-32 space-y-6">
            
            {/* Latar Belakang Ambient Merah */}
            <div className="absolute top-0 left-0 right-0 flex justify-center w-full pointer-events-none -z-10">
                <div className="w-[80vw] max-w-[600px] h-[300px] bg-red-500/10 dark:bg-red-500/5 rounded-[100%] blur-[80px] -mt-10"></div>
            </div>

            <div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
                <HeaderTitle
                    title="Pos Pemadam Terdekat"
                    subtitle="Lacak pos pemadam kebakaran terdekat dari lokasi Anda."
                    icon={IconFiretruck}
                />
            </div>

            <div className="flex flex-col items-start w-full gap-6 lg:flex-row">
                
                {/* KOLOM KIRI */}
                <div className="flex flex-col w-full gap-5 shrink-0 lg:w-5/12 xl:w-1/3">
                    
                    <Card className="overflow-hidden border-gray-200 shadow-sm rounded-3xl dark:border-slate-800 dark:bg-slate-900/60 backdrop-blur-sm">
                        <CardContent className="p-5">
                            <form onSubmit={handleSearch} className="flex flex-col gap-4">
                                
                                {/* Tombol Lacak Merah */}
                                <Button 
                                    type="button"
                                    onClick={handleNearestSearch}
                                    disabled={isLocating || processing}
                                    className="flex items-center w-full h-12 gap-2 text-red-700 transition-colors border border-red-200 shadow-sm rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 dark:border-red-800/50"
                                >
                                    {isLocating ? <IconLoader2 className="w-5 h-5 animate-spin" /> : <IconRadar className="w-5 h-5" />}
                                    {isLocating ? 'Melacak Lokasi Anda...' : 'Cari Pos Terdekat'}
                                </Button>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                        <IconSearch className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="Cari nama pos atau area..."
                                        className="w-full h-12 bg-white border-gray-200 pl-11 rounded-xl dark:bg-slate-900 dark:border-slate-800 focus-visible:ring-red-500"
                                        value={data.search}
                                        onChange={(e) => setData('search', e.target.value)}
                                    />
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* List Daftar Pos (1 Scroll) */}
                    <div className="flex flex-col gap-3.5 pb-4">
                        {stations.data && stations.data.length > 0 ? (
                            stations.data.map((station) => (
                                <Card key={station.id} className="overflow-hidden transition-all duration-300 border border-gray-100 shadow-sm shrink-0 rounded-2xl dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm hover:shadow-md hover:border-red-300 dark:hover:border-red-700 group">
                                    <CardContent className="flex flex-row items-center gap-3 p-3 sm:p-4 sm:gap-4 flex-nowrap">
                                        
                                        {/* KIRI: Ikon Mobil Pemadam */}
                                        <div className="flex items-center justify-center w-10 h-10 text-red-600 border border-red-100 rounded-full shadow-inner sm:w-12 sm:h-12 shrink-0 bg-red-50 dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-400">
                                            <IconFiretruck className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>

                                        {/* TENGAH: Info Text */}
                                        <div className="flex-1 w-full min-w-0 py-1">
                                            <h3 className="text-[14px] sm:text-[15px] font-bold text-gray-900 dark:text-slate-100 truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                                {station.name}
                                            </h3>
                                            <p className="text-[12px] sm:text-[13px] text-gray-500 dark:text-slate-400 truncate mt-0.5">
                                                {station.address}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-md border whitespace-nowrap bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30">
                                                    {station.status}
                                                </span>
                                                <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 dark:text-slate-500 border-l border-gray-200 dark:border-slate-700 pl-1.5 sm:pl-2">
                                                    {station.vehicle_count} Armada
                                                </span>
                                            </div>
                                        </div>

                                        {/* KANAN: Jarak & Telepon */}
                                        <div className="flex flex-col items-end justify-center gap-1.5 sm:gap-2 shrink-0">
                                            {station.distance !== '-' ? (
                                                <span className="px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-extrabold text-red-700 bg-red-50 border border-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50 whitespace-nowrap">
                                                    {station.distance}
                                                </span>
                                            ) : (
                                                <span className="h-[20px] sm:h-[22px]"></span> 
                                            )}
                                            
                                            {/* Tombol Telepon Langsung */}
                                            <a href={`tel:${station.phone}`}>
                                                <Button variant="ghost" size="icon" className="text-gray-400 transition-colors rounded-full h-7 w-7 sm:h-8 sm:w-8 hover:text-white hover:bg-green-500 dark:hover:text-white dark:hover:bg-green-600">
                                                    <IconPhoneCall className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                                </Button>
                                            </a>
                                        </div>

                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-10 text-center border-2 border-gray-200 border-dashed rounded-3xl dark:border-slate-800 opacity-60">
                                <IconFiretruck className="w-12 h-12 mb-2 text-gray-400" />
                                <h4 className="text-sm font-bold text-gray-700 dark:text-slate-300">Tidak ada pos pemadam</h4>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- KOLOM KANAN: Peta Interaktif (Sticky) --- */}
                <div className="flex flex-col w-full gap-3 lg:flex-1 lg:sticky lg:top-[90px]">
                    
                    {/* Header Peta (Sekarang di Luar Peta) */}
                    <div className="flex items-center gap-2 px-1">
                        <IconMapPinFilled className="w-5 h-5 text-red-500" />
                        <h2 className="text-[16px] font-bold text-gray-800 dark:text-slate-200">Sebaran Pos Pemadam</h2>
                    </div>

                    {/* Wrapper Peta */}
                    <div className="w-full h-[400px] lg:h-[calc(100vh-160px)] rounded-3xl overflow-hidden border border-gray-200 shadow-md dark:border-slate-800 bg-[#e5e3df] dark:bg-[#1a1a1a] relative z-0">
                        <UserLeafletMap markers={stations.data} />
                    </div>

                </div>

            </div>
        </div>
    );
}

Index.layout = (page) => <AppLayout children={page} title="Pos Pemadam Terdekat" />;