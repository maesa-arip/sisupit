import ComboBox from '@/Components/ComboBox';
import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AppLayout from '@/Layouts/AppLayout';
import { Link, useForm } from '@inertiajs/react';
import { IconMapPinFilled, IconMedal, IconPhone, IconRadar, IconSearch, IconUsersGroup } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { GEO_OPTIONS } from '@/lib/utils';

export default function Index({ volunteers2, filters, ...props }) {
    const [isLocating, setIsLocating] = useState(false);

    const { data, setData, get, processing } = useForm({
        search: '',
        kabupaten: '',
        kecamatan: '',
        desa: '',
        is_my_area: false,
        lat: '',
        lng: '',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        get(route('front.volunteers.index'), { preserveState: true, preserveScroll: true });
    };

    const handleMyAreaSearch = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setData((prev) => ({
                        ...prev,
                        is_my_area: true,
                        lat: latitude,
                        lng: longitude,
                        kabupaten: '',
                        kecamatan: '',
                        desa: '',
                    }));

                    toast.success('Lokasi Anda ditemukan! Mencari relawan terdekat...');
                    setTimeout(() => setIsLocating(false), 1000); 
                },
                (error) => {
                    console.error('Error:', error);
                    toast.error('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
                    setIsLocating(false);
                },
                GEO_OPTIONS.oneShot,
            );
        } else {
            toast.error('Browser Anda tidak mendukung Geolokasi.');
            setIsLocating(false);
        }
    };

    // DUMMY DATA
    const volunteers = [
        {
            id: 1,
            name: 'Budi Santoso',
            area: 'Kec. Denpasar Selatan, Kota Denpasar',
            skills: ['Pemadam Api', 'P3K'],
            avatar: null,
            status: 'Aktif',
        },
        {
            id: 2,
            name: 'Wayan Dipta',
            area: 'Kec. Kuta, Kab. Badung',
            skills: ['Evakuasi', 'Logistik'],
            avatar: 'https://i.pravatar.cc/150?img=11',
            status: 'Sibuk',
        },
        {
            id: 3,
            name: 'Siti Aminah',
            area: 'Kec. Denpasar Utara, Kota Denpasar',
            skills: ['Medis / P3K'],
            avatar: 'https://i.pravatar.cc/150?img=5',
            status: 'Aktif',
        },
        {
            id: 4,
            name: 'Made Yasa',
            area: 'Kec. Mengwi, Kab. Badung',
            skills: ['Distribusi Air', 'Pemadam Api'],
            avatar: null,
            status: 'Aktif',
        },
    ];

    return (
        <div className="relative flex flex-col w-full pb-32 space-y-6">

            {/* Header */}
            <div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
                <HeaderTitle
                    title="Daftar Relawan"
                    subtitle="Temukan pahlawan di sekitar Anda atau cari berdasarkan wilayah."
                    icon={IconUsersGroup}
                />
            </div>

            {/* --- PANEL PENCARIAN & FILTER --- */}
            <Card className="overflow-hidden border-border shadow-sm rounded-xl">
                <CardContent className="p-5 sm:p-6">
                    <form onSubmit={handleSearch} className="flex flex-col gap-5">

                        {/* Baris Atas: Tombol "Daerah Saya" & Search Nama */}
                        <div className="flex flex-col gap-3 md:flex-row">
                            <Button
                                type="button"
                                onClick={handleMyAreaSearch}
                                disabled={isLocating}
                                variant="outline"
                                className="flex items-center w-full h-10 gap-2 px-4 transition-colors border-border bg-card text-foreground/80 shadow-sm shrink-0 rounded-md hover:bg-muted md:w-auto"
                            >
                                {isLocating ? (
                                    <IconRadar className="w-4 h-4 animate-spin text-destructive" />
                                ) : (
                                    <IconMapPinFilled className="w-4 h-4 text-destructive" />
                                )}
                                {isLocating ? 'Mencari Lokasi...' : 'Daerah Saya'}
                            </Button>

                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <IconSearch className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <Input
                                    type="text"
                                    placeholder="Cari nama relawan..."
                                    className="w-full h-10 border-border rounded-md bg-card pl-9 focus-visible:ring-1 focus-visible:ring-destructive"
                                    value={data.search}
                                    onChange={(e) => setData('search', e.target.value)}
                                />
                            </div>
                        </div>

                        <hr className="border-border" />

                        {/* Baris Bawah: Filter Wilayah (Menggunakan ComboBox) */}
                        <div className="grid items-end grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-4">

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Kabupaten / Kota</Label>
                                <ComboBox
                                    items={props.page_data?.kabupaten || []}
                                    selectedItem={data.kabupaten}
                                    onSelect={(currentValue) => setData('kabupaten', currentValue)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Kecamatan</Label>
                                <ComboBox
                                    items={props.page_data?.kecamatan || []}
                                    selectedItem={data.kecamatan}
                                    onSelect={(currentValue) => setData('kecamatan', currentValue)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Desa / Kelurahan</Label>
                                <ComboBox
                                    items={props.page_data?.desa || []}
                                    selectedItem={data.desa}
                                    onSelect={(currentValue) => setData('desa', currentValue)}
                                />
                            </div>

                            {/* Tombol Submit Filter */}
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full h-10 font-medium text-destructive-foreground rounded-md bg-destructive hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50"
                            >
                                Terapkan Filter
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* --- DAFTAR GRID RELAWAN --- */}
            <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {volunteers.length > 0 ? (
                    volunteers.map((volunteer) => (
                        <Card
                            key={volunteer.id}
                            className="flex flex-col h-full overflow-hidden transition-all duration-200 border-border bg-card shadow-sm group rounded-xl hover:border-muted-foreground/30 hover:shadow-md"
                        >
                            <CardContent className="flex flex-col flex-1 p-5">
                                <div className="flex items-start justify-between mb-4">
                                    {/* Avatar */}
                                    <div className="flex items-center justify-center overflow-hidden text-lg font-bold border rounded-lg shadow-sm h-12 w-12 shrink-0 border-border bg-muted text-muted-foreground">
                                        {volunteer.avatar ? (
                                            <img
                                                src={volunteer.avatar}
                                                alt={volunteer.name}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <IconUsersGroup className="w-5 h-5" stroke={1.5} />
                                        )}
                                    </div>

                                    {/* Status Badge */}
                                    <span
                                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                            volunteer.status === 'Aktif'
                                                ? 'border-green-200 dark:border-success/30 bg-green-50 dark:bg-success/10 text-green-700 dark:text-success'
                                                : 'border-red-200 dark:border-warning/30 bg-red-50 dark:bg-warning/10 text-red-700 dark:text-warning'
                                        }`}
                                    >
                                        {volunteer.status}
                                    </span>
                                </div>

                                {/* Info Relawan */}
                                <div className="flex-1">
                                    <h3 className="text-base font-semibold text-foreground transition-colors line-clamp-1 group-hover:text-destructive">
                                        {volunteer.name}
                                    </h3>
                                    <p className="mt-1 line-clamp-2 flex items-start gap-1.5 text-[13px] leading-snug text-muted-foreground">
                                        <IconMapPinFilled className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        {volunteer.area}
                                    </p>
                                </div>

                                {/* Keahlian / Badge Skills */}
                                <div className="mb-5 mt-4 flex flex-wrap gap-1.5">
                                    {volunteer.skills.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-medium text-foreground/80"
                                        >
                                            <IconMedal className="w-3 h-3 text-destructive" stroke={1.5} />
                                            {skill}
                                        </span>
                                    ))}
                                </div>

                                <Button variant="outline" className="w-full text-foreground/80 transition-colors bg-card border-border rounded-md hover:bg-muted h-9" asChild>
                                    <Link href={route('front.volunteers.show', volunteer.id)} className="flex items-center justify-center gap-2">
                                        <IconPhone className="w-4 h-4" /> Lihat Profil
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    /* State Jika Data Kosong */
                    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border col-span-full rounded-xl bg-muted">
                        <IconUsersGroup className="w-12 h-12 mb-3 text-muted-foreground" stroke={1.5} />
                        <h3 className="text-base font-semibold text-foreground">
                            Belum ada relawan ditemukan
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Coba ubah filter pencarian Anda atau perluas jangkauan wilayah.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

Index.layout = (page) => <AppLayout children={page} title="Daftar Relawan" />;