import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import UserLeafletMap from '@/Components/UserLeafletMap';
import AppLayout from '@/Layouts/AppLayout';
import { Link, router, useForm } from '@inertiajs/react';
import {
    IconDroplet,
    IconLoader2,
    IconMapPinFilled,
    IconRadar,
    IconRoute,
    IconSearch,
    IconTool,
} from '@tabler/icons-react';
import { useState } from 'react';

export default function Index({ map_markers, hydrants, filters, ...props }) {
    const [isLocating, setIsLocating] = useState(false);

    const { data, setData, get, processing } = useForm({
        search: filters?.search || '',
        status: filters?.status || 'Semua',
        is_nearest: filters?.is_nearest || false,
        lat: filters?.lat || '',
        lng: filters?.lng || '',
    });

    // PERBAIKAN 2: Fungsi khusus agar filter status dikirim bersamaan dengan parameter terbaru
    const applyFilter = (key, value) => {
        setData(key, value); // Update UI state
        
        // Buat payload baru agar tidak menunggu state React yang asynchronous
        const payload = { ...data, [key]: value };
        
        router.get(route('front.hydrants.index'), payload, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilter('search', data.search);
    };

    const handleNearestSearch = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setData('is_nearest', true);
                    setData('lat', latitude);
                    setData('lng', longitude);
                    
                    router.get(route('front.hydrants.index'), {
                        ...data,
                        is_nearest: true,
                        lat: latitude,
                        lng: longitude
                    }, {
                        preserveState: true,
                        preserveScroll: true,
                        onFinish: () => setIsLocating(false),
                    });
                },
                (error) => {
                    console.error('Gagal akses GPS:', error);
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
                    title="Jaringan Hydrant"
                    subtitle="Temukan titik hydrant pemadam terdekat dari lokasi Anda."
                    icon={IconDroplet}
                />
            </div>

            <div className="flex flex-col items-start w-full gap-5 lg:flex-row lg:gap-6">
                
                {/* --- KOLOM KIRI (Filter & List) --- */}
                <div className="flex flex-col w-full gap-5 shrink-0 lg:w-5/12 xl:w-1/3">
                    
                    {/* Kotak Pencarian & Filter */}
                    <Card className="overflow-hidden border border-[#e5e5e5] shadow-sm rounded-xl bg-white dark:border-[#262626] dark:bg-[#151515]">
                        <CardContent className="p-5">
                            <form onSubmit={handleSearch} className="flex flex-col gap-4">
                                <Button
                                    type="button"
                                    onClick={handleNearestSearch}
                                    disabled={isLocating || processing}
                                    className="flex items-center w-full h-10 gap-2 text-sm font-medium text-teal-700 transition-colors border border-teal-200 shadow-sm rounded-md bg-teal-50 hover:bg-teal-100 dark:border-[#134e4a] dark:bg-[#042f2e] dark:text-[#2dd4bf] dark:hover:bg-[#115e59]"
                                >
                                    {isLocating ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconRadar className="w-4 h-4" />}
                                    {isLocating ? 'Melacak Lokasi Anda...' : 'Cari Hydrant Terdekat'}
                                </Button>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <IconSearch className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="Cari nama area atau jalan..."
                                        className="w-full h-10 text-sm bg-gray-50 border-[#e5e5e5] rounded-md pl-9 focus-visible:ring-1 focus-visible:ring-teal-500 dark:border-[#333] dark:bg-[#101010] dark:text-gray-100 dark:focus-visible:ring-gray-500"
                                        value={data.search}
                                        onChange={(e) => setData('search', e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-hide">
                                    <button
                                        type="button"
                                        onClick={() => applyFilter('status', 'Semua')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors border ${
                                            data.status === 'Semua' || !data.status
                                            ? 'bg-gray-900 text-white border-transparent dark:bg-gray-100 dark:text-[#101010]'
                                            : 'bg-white text-gray-600 border-[#e5e5e5] hover:bg-gray-50 dark:bg-[#1f1f1f] dark:border-[#333] dark:text-gray-300 dark:hover:bg-[#262626]'
                                        }`}
                                    >
                                        Semua
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyFilter('status', 'Aktif')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors border ${
                                            data.status === 'Aktif'
                                            ? 'bg-gray-900 text-white border-transparent dark:bg-gray-100 dark:text-[#101010]'
                                            : 'bg-white text-gray-600 border-[#e5e5e5] hover:bg-gray-50 dark:bg-[#1f1f1f] dark:border-[#333] dark:text-gray-300 dark:hover:bg-[#262626]'
                                        }`}
                                    >
                                        Berfungsi
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyFilter('status', 'Perbaikan')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors border ${
                                            data.status === 'Perbaikan'
                                            ? 'bg-gray-900 text-white border-transparent dark:bg-gray-100 dark:text-[#101010]'
                                            : 'bg-white text-gray-600 border-[#e5e5e5] hover:bg-gray-50 dark:bg-[#1f1f1f] dark:border-[#333] dark:text-gray-300 dark:hover:bg-[#262626]'
                                        }`}
                                    >
                                        Perbaikan
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Daftar List Hydrant */}
                    <div className="flex flex-col gap-3">
                        {hydrants.data && hydrants.data.length > 0 ? (
                            hydrants.data.map((hydrant) => (
                                <Card key={hydrant.id} className="overflow-hidden transition-all duration-200 border border-[#e5e5e5] shadow-sm cursor-pointer group shrink-0 rounded-lg bg-white hover:border-gray-300 dark:border-[#262626] dark:bg-[#151515] dark:hover:border-[#333]">
                                    <CardContent className="flex flex-row items-center gap-3 p-3 flex-nowrap sm:p-4">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                                                hydrant.status === 'Aktif'
                                                    ? 'border-teal-200 bg-teal-50 text-teal-600 dark:border-[#134e4a] dark:bg-[#042f2e] dark:text-[#2dd4bf]'
                                                    : 'border-amber-200 bg-amber-50 text-amber-600 dark:border-[#78350f] dark:bg-[#451a03] dark:text-[#fbbf24]'
                                            }`}
                                        >
                                            {hydrant.status === 'Aktif' ? <IconDroplet className="w-5 h-5" stroke={1.5} /> : <IconTool className="w-5 h-5" stroke={1.5} />}
                                        </div>

                                        <div className="flex-1 w-full min-w-0 py-1">
                                            <h3 className="text-sm font-semibold text-gray-900 truncate transition-colors group-hover:text-teal-600 dark:text-gray-100 dark:group-hover:text-teal-400">
                                                {hydrant.name}
                                            </h3>
                                            <p className="mt-0.5 truncate text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                                                {hydrant.address}
                                            </p>
                                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                <span className={`whitespace-nowrap rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                                                        hydrant.status === 'Aktif'
                                                            ? 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/30 dark:bg-[#0f3a38] dark:text-teal-500'
                                                            : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-[#3b1803] dark:text-amber-500'
                                                    }`}
                                                >
                                                    {hydrant.status === 'Aktif' ? 'Berfungsi' : 'Perbaikan'}
                                                </span>
                                                <span className="max-w-[80px] truncate border-l border-[#e5e5e5] pl-1.5 text-[10px] font-medium text-gray-500 dark:border-[#333] dark:text-gray-400 sm:max-w-none sm:pl-2">
                                                    Hydrant {hydrant.type}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end justify-center gap-2 shrink-0">
                                            {hydrant.distance !== '-' ? (
                                                <span className="whitespace-nowrap rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-700 dark:border-[#333] dark:bg-[#1f1f1f] dark:text-gray-300">
                                                    {hydrant.distance}
                                                </span>
                                            ) : <span className="h-[20px]"></span>}
                                            
                                            <a href={`https://www.google.com/maps/dir/?api=1&destination=$${hydrant.lat},${hydrant.lng}`} target="_blank" rel="noopener noreferrer">
                                                <Button type="button" variant="ghost" size="icon" className="w-8 h-8 text-gray-400 transition-colors rounded-md hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#1f1f1f] dark:hover:text-gray-300">
                                                    <IconRoute className="w-4 h-4" />
                                                </Button>
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed border-[#e5e5e5] bg-gray-50/50 rounded-xl dark:border-[#333] dark:bg-[#101010]">
                                <IconDroplet className="w-10 h-10 mb-2 text-gray-400 dark:text-gray-500" stroke={1.5} />
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tidak ada data hydrant</h4>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Coba ubah kata kunci pencarian Anda.</p>
                            </div>
                        )}
                    </div>

                    {/* PERBAIKAN 3: PAGINASI RESPONSIF (Berlaku untuk Mobile dan Desktop) */}
                    {hydrants.links && hydrants.links.length > 3 && (
                        <div className="flex justify-center pt-4 pb-4 overflow-x-auto scrollbar-hide">
                            <div className="flex gap-1">
                                {hydrants.links.map((link, index) => (
                                    <Link
                                        key={index} href={link.url} preserveScroll
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                                            link.active 
                                            ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-[#101010]' 
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-[#151515] dark:border-[#333] dark:text-gray-400 dark:hover:bg-[#1f1f1f]'
                                        } ${!link.url && 'opacity-50 cursor-not-allowed pointer-events-none'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* --- KOLOM KANAN: Peta Interaktif (Sticky) --- */}
                <div className="flex flex-col w-full gap-3 lg:flex-1 lg:sticky lg:top-[90px]">
                    <div className="flex items-center gap-2 px-1">
                        <IconMapPinFilled className="w-4 h-4 text-[#b42826] dark:text-[#e54845]" />
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sebaran Titik Hydrant</h2>
                    </div>

                    <div className="w-full h-[400px] lg:h-[calc(100vh-160px)] rounded-xl overflow-hidden border border-[#e5e5e5] shadow-sm dark:border-[#262626] bg-[#e5e3df] dark:bg-[#1a1a1a] relative z-0">
                        {/* PETA MENGGUNAKAN map_markers */}
                        <UserLeafletMap markers={map_markers} lat={filters.lat} lng={filters.lng} />
                    </div>
                </div>

            </div>
        </div>
    );
}

Index.layout = (page) => <AppLayout children={page} title="Lokasi Hydrant Pemadam" />;