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
import { GEO_OPTIONS } from '@/lib/utils';

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
                },
                GEO_OPTIONS.oneShot
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
                    <Card className="overflow-hidden border border-border shadow-sm rounded-xl bg-card">
                        <CardContent className="p-5">
                            <form onSubmit={handleSearch} className="flex flex-col gap-4">

                                {/* Tombol Lacak */}
                                <Button
                                    type="button"
                                    onClick={handleNearestSearch}
                                    disabled={isLocating || processing}
                                    className="flex items-center w-full h-10 gap-2 text-sm font-medium text-destructive transition-colors border border-destructive/30 shadow-sm rounded-md bg-destructive/10 hover:bg-destructive/20"
                                >
                                    {isLocating ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconRadar className="w-4 h-4" />}
                                    {isLocating ? 'Melacak Lokasi Anda...' : 'Cari Pos Terdekat'}
                                </Button>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <IconSearch className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="Cari nama pos atau area..."
                                        className="w-full h-10 text-sm bg-muted border-border rounded-md pl-9 focus-visible:ring-1 focus-visible:ring-destructive"
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
                                <Card key={station.id} className="overflow-hidden transition-all duration-200 border border-border shadow-sm shrink-0 rounded-lg bg-card hover:border-muted-foreground/30 group">
                                    <CardContent className="flex flex-row items-center gap-3 p-3 sm:p-4 flex-nowrap">

                                        {/* KIRI: Ikon Mobil Pemadam */}
                                        <div className="flex items-center justify-center w-10 h-10 text-destructive border border-destructive/20 rounded-md shrink-0 bg-destructive/10">
                                            <IconFiretruck className="w-5 h-5" stroke={1.5} />
                                        </div>

                                        {/* TENGAH: Info Text */}
                                        <div className="flex-1 w-full min-w-0 py-1">
                                            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-destructive transition-colors">
                                                {station.name}
                                            </h3>
                                            <p className="text-[11px] sm:text-xs text-muted-foreground truncate mt-0.5">
                                                {station.address}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border whitespace-nowrap bg-green-50 dark:bg-success/10 text-green-700 dark:text-success border-green-200 dark:border-success/30">
                                                    {station.status}
                                                </span>
                                                <span className="text-[10px] font-medium text-muted-foreground border-l border-border pl-1.5 sm:pl-2">
                                                    {station.vehicle_count} Armada
                                                </span>
                                            </div>
                                        </div>

                                        {/* KANAN: Jarak & Telepon */}
                                        <div className="flex flex-col items-end justify-center gap-2 shrink-0">
                                            {station.distance !== '-' ? (
                                                <span className="px-2 py-0.5 text-[10px] font-semibold text-foreground/80 bg-muted border border-border rounded-md whitespace-nowrap">
                                                    {station.distance}
                                                </span>
                                            ) : (
                                                <span className="h-[20px]"></span>
                                            )}

                                            {/* Tombol Telepon Langsung */}
                                            <a href={`tel:${station.phone}`}>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground transition-colors rounded-md hover:text-white dark:hover:text-success hover:bg-emerald-600 dark:hover:bg-success/20">
                                                    <IconPhoneCall className="w-4 h-4" />
                                                </Button>
                                            </a>
                                        </div>

                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed border-border rounded-xl bg-muted/50">
                                <IconFiretruck className="w-10 h-10 mb-2 text-muted-foreground" stroke={1.5} />
                                <h4 className="text-sm font-semibold text-foreground">Tidak ada pos pemadam</h4>
                                <p className="mt-1 text-xs text-muted-foreground">Coba ubah kata kunci pencarian Anda.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- KOLOM KANAN: Peta Interaktif (Sticky) --- */}
                <div className="flex flex-col w-full gap-3 lg:flex-1 lg:sticky lg:top-[90px]">
                    
                    {/* Header Peta */}
                    <div className="flex items-center gap-2 px-1">
                        <IconMapPinFilled className="w-4 h-4 text-destructive" />
                        <h2 className="text-sm font-semibold text-foreground">Sebaran Pos Pemadam</h2>
                    </div>

                    {/* Wrapper Peta */}
                    <div className="w-full h-[400px] lg:h-[calc(100vh-160px)] rounded-xl overflow-hidden border border-border shadow-sm bg-muted relative z-0">
                        <UserLeafletMap markers={stations.data} />
                    </div>

                </div>

            </div>
        </div>
    );
}

Index.layout = (page) => <AppLayout children={page} title="Pos Pemadam Terdekat" />;