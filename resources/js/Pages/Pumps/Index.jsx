import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import UserLeafletMap from '@/Components/UserLeafletMap';
import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
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

export default function Index({ pumps, filters, ...props }) {
    const [isLocating, setIsLocating] = useState(false);

    const { data, setData, get, processing } = useForm({
        search: filters?.search || '',
        status: filters?.status || 'Semua',
        is_nearest: filters?.is_nearest || false,
        lat: filters?.lat || '',
        lng: filters?.lng || '',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        get(route('front.pumps.index'), { preserveState: true, preserveScroll: true });
    };

    const handleNearestSearch = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    data.is_nearest = true;
                    data.lat = latitude;
                    data.lng = longitude;
                    get(route('front.pumps.index'), {
                        preserveState: true,
                        preserveScroll: true,
                        onFinish: () => setIsLocating(false),
                    });
                },
                (error) => {
                    console.error('Gagal akses GPS:', error);
                    alert('Gagal mendapatkan lokasi. Pastikan izin GPS (Location) aktif di browser Anda.');
                    setIsLocating(false);
                },
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
                    title="Lokasi Pompa Air"
                    subtitle="Temukan titik hydrant atau pompa air portabel terdekat."
                    icon={IconDroplet}
                />
            </div>

            <div className="flex flex-col items-start w-full gap-5 lg:flex-row lg:gap-6">
                {/* KOLOM KIRI */}
                <div className="flex flex-col w-full gap-5 shrink-0 lg:w-5/12 xl:w-1/3">
                    
                    {/* Kotak Pencarian */}
                    <Card className="overflow-hidden border-[#e5e5e5] shadow-sm rounded-xl bg-white dark:border-[#262626] dark:bg-[#151515]">
                        <CardContent className="p-5">
                            <form onSubmit={handleSearch} className="flex flex-col gap-4">
                                <Button
                                    type="button"
                                    onClick={handleNearestSearch}
                                    disabled={isLocating || processing}
                                    className="flex items-center w-full h-10 gap-2 text-sm font-medium text-blue-700 transition-colors border border-blue-200 shadow-sm rounded-md bg-blue-50 hover:bg-blue-100 dark:border-[#1e3a5f] dark:bg-[#111e36] dark:text-[#60a5fa] dark:hover:bg-[#1a2c4e]"
                                >
                                    {isLocating ? (
                                        <IconLoader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <IconRadar className="w-4 h-4" />
                                    )}
                                    {isLocating ? 'Melacak Lokasi Anda...' : 'Cari Pompa Terdekat'}
                                </Button>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <IconSearch className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="Cari nama area atau jalan..."
                                        className="w-full h-10 text-sm bg-gray-50 border-[#e5e5e5] rounded-md pl-9 focus-visible:ring-1 focus-visible:ring-blue-500 dark:border-[#333] dark:bg-[#101010] dark:text-gray-100 dark:focus-visible:ring-gray-500"
                                        value={data.search}
                                        onChange={(e) => setData('search', e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-hide">
                                    <button
                                        type="button"
                                        onClick={() => { setData('status', 'Semua'); get(route('front.pumps.index')); }}
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
                                        onClick={() => { setData('status', 'Aktif'); get(route('front.pumps.index')); }}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors border ${
                                            data.status === 'Aktif'
                                            ? 'bg-gray-900 text-white border-transparent dark:bg-gray-100 dark:text-[#101010]'
                                            : 'bg-white text-gray-600 border-[#e5e5e5] hover:bg-gray-50 dark:bg-[#1f1f1f] dark:border-[#333] dark:text-gray-300 dark:hover:bg-[#262626]'
                                        }`}
                                    >
                                        Siap Pakai
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setData('status', 'Perbaikan'); get(route('front.pumps.index')); }}
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

                    {/* List Daftar Pompa */}
                    <div className="flex flex-col gap-3 pb-4">
                        {pumps.data && pumps.data.length > 0 ? (
                            pumps.data.map((pump) => (
                                <Card
                                    key={pump.id}
                                    className="overflow-hidden transition-all duration-200 border border-[#e5e5e5] shadow-sm cursor-pointer group shrink-0 rounded-lg bg-white hover:border-gray-300 dark:border-[#262626] dark:bg-[#151515] dark:hover:border-[#333]"
                                >
                                    <CardContent className="flex flex-row items-center gap-3 p-3 flex-nowrap sm:p-4">
                                        {/* KIRI: Ikon */}
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                                                pump.status === 'Aktif'
                                                    ? 'border-blue-100 bg-blue-50 text-blue-600 dark:border-[#1e3a5f] dark:bg-[#111e36] dark:text-[#60a5fa]'
                                                    : 'border-orange-100 bg-orange-50 text-orange-600 dark:border-orange-900/40 dark:bg-[#2b1911] dark:text-orange-500'
                                            }`}
                                        >
                                            {pump.status === 'Aktif' ? (
                                                <IconDroplet className="w-5 h-5" stroke={1.5} />
                                            ) : (
                                                <IconTool className="w-5 h-5" stroke={1.5} />
                                            )}
                                        </div>

                                        {/* TENGAH: Info Text */}
                                        <div className="flex-1 w-full min-w-0 py-1">
                                            <h3 className="text-sm font-semibold text-gray-900 truncate transition-colors group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                                                {pump.name}
                                            </h3>
                                            <p className="mt-0.5 truncate text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                                                {pump.address}
                                            </p>
                                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                <span
                                                    className={`whitespace-nowrap rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                                                        pump.status === 'Aktif'
                                                            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-[#112a1d] dark:text-green-500'
                                                            : 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/30 dark:bg-[#2b1911] dark:text-orange-500'
                                                    }`}
                                                >
                                                    {pump.status}
                                                </span>
                                                <span className="max-w-[80px] truncate border-l border-[#e5e5e5] pl-1.5 text-[10px] font-medium text-gray-500 dark:border-[#333] dark:text-gray-400 sm:max-w-none sm:pl-2">
                                                    {pump.type}
                                                </span>
                                            </div>
                                        </div>

                                        {/* KANAN: Aksi & Jarak */}
                                        <div className="flex flex-col items-end justify-center gap-2 shrink-0">
                                            {pump.distance !== '-' ? (
                                                <span className="whitespace-nowrap rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-700 dark:border-[#333] dark:bg-[#1f1f1f] dark:text-gray-300">
                                                    {pump.distance}
                                                </span>
                                            ) : (
                                                <span className="h-[20px]"></span>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-gray-400 transition-colors rounded-md h-8 w-8 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#1f1f1f] dark:hover:text-gray-300"
                                            >
                                                <IconRoute className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed border-[#e5e5e5] bg-gray-50/50 rounded-xl dark:border-[#333] dark:bg-[#101010]">
                                <IconDroplet className="w-10 h-10 mb-2 text-gray-400 dark:text-gray-500" stroke={1.5} />
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    Tidak ada data pompa
                                </h4>
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
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sebaran Titik Pompa</h2>
                    </div>

                    {/* Wrapper Peta */}
                    <div className="w-full h-[400px] lg:h-[calc(100vh-160px)] rounded-xl overflow-hidden border border-[#e5e5e5] shadow-sm dark:border-[#262626] bg-[#e5e3df] dark:bg-[#1a1a1a] relative z-0">
                        <UserLeafletMap markers={pumps.data} />
                    </div>

                </div>
            </div>
        </div>
    );
}

Index.layout = (page) => <AppLayout children={page} title="Lokasi Pompa Air" />;