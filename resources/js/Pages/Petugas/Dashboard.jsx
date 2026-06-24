import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import {
    IconAlertCircle, IconMapPin, IconClock, IconChevronRight,
    IconFiretruck, IconShieldCheck, IconRadar, IconCheck
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export default function PetugasDashboard({ auth, activeMissions = [] }) {
    const user = auth.user;
    
    // Ambil nama depan saja untuk sapaan
    const firstName = user?.name ? user.name.split(' ')[0] : 'Komandan';

    const StatusBadge = ({ status }) => {
        const variants = {
            pending: { className: "bg-red-50 dark:bg-destructive/10 text-red-700 dark:text-destructive border-red-200 dark:border-destructive/30", label: "Menunggu" },
            handling: { className: "bg-amber-50 dark:bg-warning/10 text-amber-700 dark:text-warning border-amber-200 dark:border-warning/30", label: "Penanganan" },
            resolved: { className: "bg-teal-50 dark:bg-success/10 text-teal-700 dark:text-success border-teal-200 dark:border-success/30", label: "Selesai" },
            TERLAPOR: { className: "bg-red-50 dark:bg-destructive/10 text-red-700 dark:text-destructive border-red-200 dark:border-destructive/30", label: "Darurat" },
        };
        const active = variants[status] || variants.pending;
        return <Badge variant="outline" className={cn("font-bold px-2.5 py-0.5 rounded-md shadow-sm", active.className)}>{active.label}</Badge>;
    };

    return (
        <div className="flex flex-col w-full pb-32 mx-auto space-y-6 max-w-7xl">
            <Head title="Dashboard Operasional" />

            {/* --- HEADER WELCOME --- */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">
                    Siaga, {firstName}!
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="secondary" className="border-none px-2.5 py-1 rounded-md font-bold bg-destructive text-destructive-foreground tracking-wider text-[10px]">
                        <IconShieldCheck className="w-3.5 h-3.5 mr-1" stroke={2.5} /> PETUGAS DAMKAR
                    </Badge>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                        <IconMapPin className="w-4 h-4 text-destructive" /> Wilayah Yurisdiksi Anda
                    </span>
                </div>
            </div>

            {/* --- BANNER STATUS SIAGA --- */}
            {activeMissions.length > 0 ? (
                <Card className="overflow-hidden border border-destructive/30 rounded-xl bg-destructive/10 shadow-sm">
                    <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg border bg-destructive/20 border-destructive/30 text-destructive shrink-0 animate-pulse">
                                <IconAlertCircle className="w-6 h-6" stroke={2} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-destructive">Ada {activeMissions.length} Insiden Aktif!</h3>
                                <p className="text-xs font-medium text-destructive/80">Segera pantau dan ambil tindakan operasional.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="overflow-hidden border border-teal-200 dark:border-success/30 rounded-xl bg-teal-50/50 dark:bg-success/10 shadow-sm">
                    <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 text-teal-600 dark:text-success bg-teal-100 dark:bg-success/20 border border-teal-200 dark:border-success/30 rounded-lg shrink-0">
                                <IconShieldCheck className="w-6 h-6" stroke={2} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-teal-900 dark:text-success">Wilayah Aman Terkendali</h3>
                                <p className="text-xs font-medium text-teal-700/80 dark:text-success/80">Tidak ada insiden darurat di wilayah tugas Anda saat ini.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <hr className="border-border" />

            {/* --- DAFTAR MISI AKTIF --- */}
            <div className="space-y-4">
                <h2 className="flex items-center gap-2 px-1 text-lg font-semibold text-foreground">
                    <IconRadar className="w-5 h-5 text-muted-foreground" />
                    Daftar Misi Operasional
                </h2>

                <Card className="overflow-hidden border border-border rounded-xl bg-card shadow-sm">
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            {activeMissions.length > 0 ? activeMissions.map((mission) => (
                                <Link
                                    key={mission.id}
                                    href={route('reports.show', mission.id)}
                                    className="group flex flex-col justify-between p-4 sm:p-5 transition-all duration-200 sm:flex-row sm:items-center hover:bg-destructive/5 border-b last:border-b-0 border-border"
                                >
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="text-sm sm:text-base font-bold text-foreground truncate group-hover:text-destructive transition-colors flex items-center gap-2">
                                            <IconFiretruck className="w-4 h-4 text-destructive" />
                                            {mission.title}
                                        </h4>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mt-2 text-xs font-medium text-muted-foreground">
                                            <span className="flex items-center gap-1.5 truncate">
                                                <IconMapPin className="w-4 h-4 shrink-0" />
                                                <span className="truncate">{mission.location}</span>
                                            </span>
                                            <span className="hidden text-muted-foreground/60 sm:inline">•</span>
                                            <span className="flex items-center gap-1.5 shrink-0">
                                                <IconClock className="w-4 h-4 shrink-0" />
                                                Dilaporkan {mission.time}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Kolom Status & Aksi */}
                                    <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                                        <StatusBadge status={mission.status} />

                                        <div className="flex items-center justify-center h-9 px-3 rounded-lg bg-muted group-hover:bg-destructive group-hover:text-destructive-foreground text-foreground/80 border border-transparent group-hover:border-destructive transition-all group-hover:shadow-md text-xs font-bold gap-1.5 uppercase tracking-wider">
                                            Pantau
                                            <IconChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </Link>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-muted/50">
                                    <div className="flex items-center justify-center mb-4 w-14 h-14 bg-card border border-border rounded-full shadow-sm text-muted-foreground">
                                        <IconCheck className="w-7 h-7" stroke={1.5} />
                                    </div>
                                    <h3 className="text-base font-semibold text-foreground">Tidak ada misi aktif</h3>
                                    <p className="mt-1 text-sm text-muted-foreground max-w-[280px]">
                                        Anda sedang dalam mode siaga. Laporan darurat baru akan muncul di sini.
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

PetugasDashboard.layout = (page) => <AppLayout children={page} title="Dashboard Petugas" />;