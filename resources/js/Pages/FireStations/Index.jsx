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
            
            <div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
                <HeaderTitle
                    title="Pos Pemadam Terdekat"
                    subtitle="Lacak pos pemadam kebakaran terdekat dari lokasi Anda."
                    icon={IconFiretruck}
                />
            </div>

            <div className="flex flex-col items-start w-full gap-5 lg:flex-row lg:gap-6">
                
                {/* KOLOM KIRI */}
                <div className="flex flex-col w-full gap-5 shrink-0 lg:w-5/12 xl:w-1/3">
                    
                    {/* Kotak Pencarian */}
                    <Card className="overflow-hidden border border-[#e5e5e5] shadow-sm rounded-xl bg-white dark:border-[#262626] dark:bg-[#151515]">
                        <CardContent className="p-5">
                            <form onSubmit={handleSearch} className="flex flex-col gap-4">
                                
                                {/* Tombol Lacak */}
                                <Button 
                                    type="button"
                                    onClick={handleNearestSearch}
                                    disabled={isLocating || processing}
                                    className="flex items-center w-full h-10 gap-2 text-sm font-medium text-[#b42826] transition-colors border border-red-200 shadow-sm rounded-md bg-red-50 hover:bg-red-100 dark:border-[#4a1c1c] dark:bg-[#2a1313] dark:text-[#e54845] dark:hover:bg-[#3f1919]"
                                >
                                    {isLocating ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconRadar className="w-4 h-4" />}
                                    {isLocating ? 'Melacak Lokasi Anda...' : 'Cari Pos Terdekat'}
                                </Button>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <IconSearch className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="Cari nama pos atau area..."
                                        className="w-full h-10 text-sm bg-gray-50 border-[#e5e5e5] rounded-md pl-9 focus-visible:ring-1 focus-visible:ring-[#b42826] dark:border-[#333] dark:bg-[#101010] dark:text-gray-100 dark:focus-visible:ring-gray-500"
                                        value={data.search}
                                        onChange={(e) => setData('search', e.target.value)}
                                    />
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* List Daftar Pos */}
                    <div className="flex flex-col gap-3 pb-4">
                        {stations.data && stations.data.length > 0 ? (
                            stations.data.map((station) => (
                                <Card key={station.id} className="overflow-hidden transition-all duration-200 border border-[#e5e5e5] shadow-sm shrink-0 rounded-lg bg-white hover:border-gray-300 dark:border-[#262626] dark:bg-[#151515] dark:hover:border-[#333] group">
                                    <CardContent className="flex flex-row items-center gap-3 p-3 sm:p-4 flex-nowrap">
                                        
                                        {/* KIRI: Ikon Mobil Pemadam */}
                                        <div className="flex items-center justify-center w-10 h-10 text-[#b42826] border border-red-100 rounded-md shrink-0 bg-red-50 dark:border-[#4a1c1c] dark:bg-[#2a1313] dark:text-[#e54845]">
                                            <IconFiretruck className="w-5 h-5" stroke={1.5} />
                                        </div>

                                        {/* TENGAH: Info Text */}
                                        <div className="flex-1 w-full min-w-0 py-1">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-[#b42826] dark:group-hover:text-[#e54845] transition-colors">
                                                {station.name}
                                            </h3>
                                            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                {station.address}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border whitespace-nowrap bg-green-50 text-green-700 border-green-200 dark:bg-[#112a1d] dark:text-green-500 dark:border-green-900/30">
                                                    {station.status}
                                                </span>
                                                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 border-l border-[#e5e5e5] dark:border-[#333] pl-1.5 sm:pl-2">
                                                    {station.vehicle_count} Armada
                                                </span>
                                            </div>
                                        </div>

                                        {/* KANAN: Jarak & Telepon */}
                                        <div className="flex flex-col items-end justify-center gap-2 shrink-0">
                                            {station.distance !== '-' ? (
                                                <span className="px-2 py-0.5 text-[10px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-md dark:bg-[#1f1f1f] dark:text-gray-300 dark:border-[#333] whitespace-nowrap">
                                                    {station.distance}
                                                </span>
                                            ) : (
                                                <span className="h-[20px]"></span> 
                                            )}
                                            
                                            {/* Tombol Telepon Langsung */}
                                            <a href={`tel:${station.phone}`}>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400 transition-colors rounded-md hover:text-white hover:bg-emerald-600 dark:hover:text-white dark:hover:bg-emerald-600">
                                                    <IconPhoneCall className="w-4 h-4" />
                                                </Button>
                                            </a>
                                        </div>

                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed border-[#e5e5e5] rounded-xl dark:border-[#333] bg-gray-50/50 dark:bg-[#101010]">
                                <IconFiretruck className="w-10 h-10 mb-2 text-gray-400 dark:text-gray-500" stroke={1.5} />
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tidak ada pos pemadam</h4>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Coba ubah kata kunci pencarian Anda.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- KOLOM KANAN: Peta Interaktif (Sticky) --- */}
                <div className="flex flex-col w-full gap-3 lg:flex-1 lg:sticky lg:top-[90px]">
                    
                    {/* Header Peta */}
                    <div className="flex items-center gap-2 px-1">
                        <IconMapPinFilled className="w-4 h-4 text-[#b42826] dark:text-[#e54845]" />
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sebaran Pos Pemadam</h2>
                    </div>

                    {/* Wrapper Peta */}
                    <div className="w-full h-[400px] lg:h-[calc(100vh-160px)] rounded-xl overflow-hidden border border-[#e5e5e5] shadow-sm dark:border-[#262626] bg-[#e5e3df] dark:bg-[#1a1a1a] relative z-0">
                        <UserLeafletMap markers={stations.data} />
                    </div>

                </div>

            </div>
        </div>
    );
}

Index.layout = (page) => <AppLayout children={page} title="Pos Pemadam Terdekat" />;