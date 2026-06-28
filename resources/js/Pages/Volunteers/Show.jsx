import HeaderTitle from '@/Components/HeaderTitle';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Link } from '@inertiajs/react';
import { 
    IconArrowLeft, 
    IconUser, 
    IconMapPinFilled, 
    IconPhone, 
    IconMail, 
    IconCalendarEvent, 
    IconMedal,
    IconBrandWhatsapp
} from '@tabler/icons-react';

export default function Show({ volunteer }) {
    const user = volunteer;

    // Normalisasi nomor untuk tautan: 08xx -> 628xx, buang karakter non-digit.
    const digits = (user.phone || '').replace(/\D/g, '');
    const waNumber = digits.startsWith('0') ? '62' + digits.slice(1) : digits;
    const hasPhone = digits.length > 0;

    return (
        <div className="relative flex flex-col w-full pb-32 space-y-6">
            
            {/* Header & Tombol Kembali */}
            <div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
                <HeaderTitle
                    title="Profil Relawan"
                    subtitle="Detail informasi dan kontak relawan."
                    icon={IconUser}
                />
                <Button variant="outline" className="h-9 px-4 rounded-md border-border bg-card text-sm font-medium text-foreground/80 hover:bg-muted shadow-sm transition-colors" asChild>
                    <Link href={route('front.volunteers.index')}>
                        <IconArrowLeft className="w-4 h-4 mr-2" />
                        Kembali
                    </Link>
                </Button>
            </div>

            {/* Layout Utama (Grid) */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                
                {/* KOLOM KIRI: Kartu Profil Utama */}
                <div className="space-y-5 lg:col-span-1">
                    <Card className="overflow-hidden border-border shadow-sm rounded-xl">

                        {/* Banner Background */}
                        <div className="relative h-24 bg-muted border-b border-border">
                            {/* Status Badge */}
                            <div className="absolute top-4 right-4">
                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                                    user.status === 'Siaga'
                                        ? 'bg-green-50 dark:bg-success/10 text-green-700 dark:text-success border-green-200 dark:border-success/30'
                                        : 'bg-red-50 dark:bg-warning/10 text-red-700 dark:text-warning border-red-200 dark:border-warning/30'
                                }`}>
                                    {user.status}
                                </span>
                            </div>
                        </div>

                        <CardContent className="flex flex-col items-center px-5 pt-0 pb-6 text-center">

                            {/* Avatar */}
                            <div className="z-10 flex items-center justify-center mb-3 overflow-hidden text-3xl font-bold border-4 border-background rounded-lg shadow-sm w-24 h-24 -mt-12 bg-muted text-muted-foreground shrink-0">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="object-cover w-full h-full" />
                                ) : (
                                    user.name.substring(0, 1).toUpperCase()
                                )}
                            </div>

                            <h2 className="mb-0.5 text-xl font-semibold text-foreground">{user.name}</h2>
                            <p className="mb-5 text-sm text-muted-foreground">Relawan Sisupit</p>

                            {/* Tombol Aksi Cepat */}
                            <div className="flex flex-col w-full gap-2.5">
                                <Button
                                    asChild
                                    disabled={!hasPhone}
                                    className="w-full h-10 font-medium text-white dark:text-success-foreground transition-colors bg-green-600 dark:bg-success rounded-md hover:bg-green-700 dark:hover:bg-success/90 aria-disabled:pointer-events-none aria-disabled:opacity-50"
                                >
                                    <a href={hasPhone ? `https://wa.me/${waNumber}` : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!hasPhone}>
                                        <IconBrandWhatsapp className="w-4 h-4 mr-2" /> WhatsApp
                                    </a>
                                </Button>
                                <div className="flex gap-2.5">
                                    <Button asChild variant="outline" disabled={!hasPhone} className="flex-1 h-10 border-border rounded-md bg-muted hover:bg-muted/70 aria-disabled:pointer-events-none aria-disabled:opacity-50">
                                        <a href={hasPhone ? `tel:${digits}` : undefined} aria-disabled={!hasPhone}>
                                            <IconPhone className="w-4 h-4 text-muted-foreground" />
                                        </a>
                                    </Button>
                                    <Button asChild variant="outline" disabled={!user.email} className="flex-1 h-10 border-border rounded-md bg-muted hover:bg-muted/70 aria-disabled:pointer-events-none aria-disabled:opacity-50">
                                        <a href={user.email ? `mailto:${user.email}` : undefined} aria-disabled={!user.email}>
                                            <IconMail className="w-4 h-4 text-muted-foreground" />
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Kartu Statistik Mini */}
                    <Card className="border-border shadow-sm rounded-xl">
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-[13px] font-medium text-muted-foreground">Total Bantuan</p>
                                <p className="text-2xl font-bold text-foreground mt-0.5">{user.reports_handled} <span className="text-sm font-normal text-muted-foreground/70">Kasus</span></p>
                            </div>
                            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-destructive/10 text-destructive">
                                <IconMedal className="w-5 h-5" stroke={1.5} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* KOLOM KANAN: Informasi Detail */}
                <div className="space-y-5 lg:col-span-2">
                    <Card className="overflow-hidden border-border shadow-sm rounded-xl">
                        <CardHeader className="pb-4 border-b border-border bg-muted/50">
                            <CardTitle className="text-base font-semibold text-foreground">Informasi Pribadi</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ul className="divide-y divide-border">

                                <li className="flex items-start gap-4 p-5 transition-colors hover:bg-muted/50">
                                    <div className="p-2 rounded-md bg-destructive/10 text-destructive">
                                        <IconMapPinFilled className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Area Wilayah</p>
                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            {user.desa}, {user.kecamatan}, {user.kabupaten}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground/70">
                                            {user.address}
                                        </p>
                                    </div>
                                </li>

                                <li className="flex items-center gap-4 p-5 transition-colors hover:bg-muted/50">
                                    <div className="p-2 rounded-md bg-destructive/10 text-destructive">
                                        <IconPhone className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Nomor Telepon</p>
                                        <p className="text-sm text-muted-foreground mt-0.5">{user.phone || 'Tidak ada nomor telepon'}</p>
                                    </div>
                                </li>

                                <li className="flex items-center gap-4 p-5 transition-colors hover:bg-muted/50">
                                    <div className="p-2 rounded-md bg-destructive/10 text-destructive">
                                        <IconMail className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Alamat Email</p>
                                        <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
                                    </div>
                                </li>

                                <li className="flex items-center gap-4 p-5 transition-colors hover:bg-muted/50">
                                    <div className="p-2 rounded-md bg-destructive/10 text-destructive">
                                        <IconCalendarEvent className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Bergabung Sejak</p>
                                        <p className="text-sm text-muted-foreground mt-0.5">{user.join_date}</p>
                                    </div>
                                </li>

                            </ul>
                        </CardContent>
                    </Card>

                    {/* Kartu Keahlian */}
                    <Card className="overflow-hidden border-border shadow-sm rounded-xl">
                        <CardHeader className="pb-4 border-b border-border bg-muted/50">
                            <CardTitle className="text-base font-semibold text-foreground">Keahlian & Kemampuan</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="flex flex-wrap gap-2">
                                {user.skills && user.skills.length > 0 ? (
                                    user.skills.map((skill, index) => (
                                        <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-foreground/80 bg-muted border border-border rounded-md">
                                            <IconMedal className="w-4 h-4 text-destructive" stroke={1.5} />
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">Belum ada data keahlian.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}

Show.layout = (page) => <AppLayout children={page} title="Profil Relawan" />;