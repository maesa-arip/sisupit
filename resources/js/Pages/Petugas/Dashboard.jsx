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
            pending: { className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:border-red-900/50 dark:text-red-400", label: "Menunggu" },
            handling: { className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-900/50 dark:text-amber-400", label: "Penanganan" },
            resolved: { className: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:border-teal-900/50 dark:text-teal-400", label: "Selesai" },
            TERLAPOR: { className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:border-red-900/50 dark:text-red-400", label: "Darurat" },
        };
        const active = variants[status] || variants.pending;
        return <Badge variant="outline" className={cn("font-bold px-2.5 py-0.5 rounded-md shadow-sm", active.className)}>{active.label}</Badge>;
    };

    return (
        <div className="flex flex-col w-full pb-32 mx-auto space-y-6 max-w-7xl">
            <Head title="Dashboard Operasional" />

            {/* --- HEADER WELCOME --- */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 uppercase dark:text-gray-100">
                    Siaga, {firstName}!
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="secondary" className="border-none px-2.5 py-1 rounded-md font-bold bg-[#b42826] text-white dark:bg-[#e54845] tracking-wider text-[10px]">
                        <IconShieldCheck className="w-3.5 h-3.5 mr-1" stroke={2.5} /> PETUGAS DAMKAR
                    </Badge>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                        <IconMapPin className="w-4 h-4 text-[#b42826] dark:text-[#e54845]" /> Wilayah Yurisdiksi Anda
                    </span>
                </div>
            </div>

            {/* --- BANNER STATUS SIAGA --- */}
            {activeMissions.length > 0 ? (
                <Card className="overflow-hidden border border-red-200 rounded-xl bg-red-50/50 dark:bg-[#2a1313]/50 dark:border-red-900/50 shadow-sm">
                    <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg border bg-red-100 border-red-200 text-[#b42826] dark:bg-[#b42826]/20 dark:border-[#b42826]/50 dark:text-[#e54845] shrink-0 animate-pulse">
                                <IconAlertCircle className="w-6 h-6" stroke={2} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[#b42826] dark:text-[#e54845]">Ada {activeMissions.length} Insiden Aktif!</h3>
                                <p className="text-xs font-medium text-red-700/80 dark:text-red-300/80">Segera pantau dan ambil tindakan operasional.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="overflow-hidden border border-teal-200 rounded-xl bg-teal-50/50 dark:bg-[#112a1d]/50 dark:border-teal-900/50 shadow-sm">
                    <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-12 h-12 text-teal-600 bg-teal-100 border border-teal-200 rounded-lg dark:bg-teal-900/50 dark:border-teal-800 dark:text-teal-400 shrink-0">
                                <IconShieldCheck className="w-6 h-6" stroke={2} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-teal-900 dark:text-teal-100">Wilayah Aman Terkendali</h3>
                                <p className="text-xs font-medium text-teal-700/80 dark:text-teal-300/80">Tidak ada insiden darurat di wilayah tugas Anda saat ini.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <hr className="border-[#e5e5e5] dark:border-[#262626]" />

            {/* --- DAFTAR MISI AKTIF --- */}
            <div className="space-y-4">
                <h2 className="flex items-center gap-2 px-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    <IconRadar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    Daftar Misi Operasional
                </h2>

                <Card className="overflow-hidden border border-[#e5e5e5] rounded-xl bg-white shadow-sm dark:border-[#262626] dark:bg-[#151515]">
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            {activeMissions.length > 0 ? activeMissions.map((mission) => (
                                <Link
                                    key={mission.id}
                                    href={route('reports.show', mission.id)}
                                    className="group flex flex-col justify-between p-4 sm:p-5 transition-all duration-200 sm:flex-row sm:items-center hover:bg-red-50/30 dark:hover:bg-[#1a1a1a] border-b last:border-b-0 border-[#e5e5e5] dark:border-[#262626]"
                                >
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="text-sm sm:text-base font-bold text-gray-900 truncate dark:text-gray-100 group-hover:text-[#b42826] dark:group-hover:text-[#e54845] transition-colors flex items-center gap-2">
                                            <IconFiretruck className="w-4 h-4 text-[#b42826] dark:text-[#e54845]" />
                                            {mission.title}
                                        </h4>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1.5 truncate">
                                                <IconMapPin className="w-4 h-4 shrink-0" />
                                                <span className="truncate">{mission.location}</span>
                                            </span>
                                            <span className="hidden text-gray-300 sm:inline dark:text-gray-600">•</span>
                                            <span className="flex items-center gap-1.5 shrink-0">
                                                <IconClock className="w-4 h-4 shrink-0" />
                                                Dilaporkan {mission.time}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Kolom Status & Aksi */}
                                    <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-[#e5e5e5] dark:border-[#262626] pt-3 sm:pt-0">
                                        <StatusBadge status={mission.status} />
                                        
                                        <div className="flex items-center justify-center h-9 px-3 rounded-lg bg-gray-100 group-hover:bg-[#b42826] group-hover:text-white text-gray-600 dark:bg-[#1f1f1f] dark:text-gray-300 dark:group-hover:bg-[#b42826] dark:group-hover:text-white border border-transparent group-hover:border-[#9a2220] transition-all group-hover:shadow-md text-xs font-bold gap-1.5 uppercase tracking-wider">
                                            Pantau
                                            <IconChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </Link>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50/50 dark:bg-[#101010]/50">
                                    <div className="flex items-center justify-center mb-4 w-14 h-14 bg-white border border-[#e5e5e5] rounded-full shadow-sm dark:bg-[#151515] dark:border-[#333] text-gray-400">
                                        <IconCheck className="w-7 h-7" stroke={1.5} />
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Tidak ada misi aktif</h3>
                                    <p className="mt-1 text-sm text-gray-500 max-w-[280px] dark:text-gray-400">
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