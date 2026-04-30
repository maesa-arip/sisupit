import HeaderTitle from '@/Components/HeaderTitle';
import IncompleteProfileDialog from '@/Components/IncompleteProfileDialog';
import InstallPWAButton from '@/Components/InstallPWAButton';
import ReportCard from '@/Components/ReportCard';
import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { IconBell, IconDashboard, IconAlertCircle, IconDroplet, IconFiretruck } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';

export default function Dashboard(props) {
    const auth = props.auth.user;
    const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);

    useEffect(() => {
        if (!auth.phone) {
            setShowIncompleteDialog(true);
        }
    }, [auth]);

    const handleConfirm = () => {
        router.visit(route('profile.edit'));
    };

    const handleHelpClick = (id) => {
        console.log('Relawan akan bantu laporan ID:', id);
    };

    return (
        <div className="flex flex-col w-full pb-32 mx-auto space-y-6 max-w-7xl">
            <div className="flex flex-col items-start justify-between lg:flex-row lg:items-center">
                <HeaderTitle
                    title={props.page_settings.title}
                    subtitle={props.page_settings.subtitle}
                    icon={IconDashboard}
                />
            </div>

            <IncompleteProfileDialog open={showIncompleteDialog} onConfirm={handleConfirm} />

            {/* --- MENU GRID QUICK ACTIONS --- */}
            <div className="grid grid-cols-2 gap-4 mt-2 mb-4">
                {/* Menu Pompa Sisupit */}
                <Dialog>
                    <DialogTrigger asChild>
                        <button className="flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                            <div className="flex items-center justify-center mb-3 text-blue-500 transition-transform duration-300 rounded-full w-14 h-14 bg-blue-50 dark:bg-blue-900/20 group-hover:scale-110">
                                <IconDroplet size={28} />
                            </div>
                            <span className="text-sm font-bold leading-tight text-center text-gray-800 dark:text-slate-200">Lokasi Pompa<br/>Sisupit</span>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-[24px] dark:bg-slate-900 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="dark:text-slate-100">Segera Hadir</DialogTitle>
                            <DialogDescription className="dark:text-slate-400">Peta Lokasi Pompa Sisupit sedang dalam tahap pengembangan. Mohon bersabar.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-gray-300 rounded-xl dark:border-slate-700">Tutup</Button>
                            </DialogTrigger>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Menu Pos Damkar */}
                <Dialog>
                    <DialogTrigger asChild>
                        <button className="flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                            <div className="flex items-center justify-center mb-3 text-red-500 transition-transform duration-300 rounded-full w-14 h-14 bg-red-50 dark:bg-red-900/20 group-hover:scale-110">
                                <IconFiretruck size={28} />
                            </div>
                            <span className="text-sm font-bold leading-tight text-center text-gray-800 dark:text-slate-200">Pos Damkar<br/>Terdekat</span>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-[24px] dark:bg-slate-900 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="dark:text-slate-100">Segera Hadir</DialogTitle>
                            <DialogDescription className="dark:text-slate-400">Fitur pelacakan Pos Damkar terdekat sedang diproses.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-gray-300 rounded-xl dark:border-slate-700">Tutup</Button>
                            </DialogTrigger>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* --- TOMBOL LAPOR --- */}
            <div className="flex justify-center w-full">
                <Link href={route('front.reports.create')} className="block w-full max-w-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500 rounded-3xl">
                    <div className="relative flex items-center justify-between p-6 overflow-hidden transition-all duration-300 shadow-lg sm:p-8 bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 rounded-3xl hover:shadow-amber-500/30 dark:hover:shadow-amber-900/40 hover:-translate-y-1 group">
                        <div className="relative z-10 flex flex-col">
                            <span className="mb-1 text-sm font-bold tracking-wider uppercase text-amber-100">Pusat Bantuan</span>
                            <span className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">Laporkan<br />Kejadian</span>
                        </div>
                        <div className="relative z-10 p-4 transition-transform duration-300 rounded-full bg-white/20 backdrop-blur-md group-hover:scale-110 group-hover:rotate-12">
                             <IconBell className="w-12 h-12 text-white" />
                        </div>
                        <div className="absolute top-0 right-0 w-40 h-40 transform translate-x-12 -translate-y-12 rounded-full bg-white/10 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 transform -translate-x-12 translate-y-12 rounded-full bg-black/10 blur-xl"></div>
                    </div>
                </Link>
            </div>

            <hr className="my-2 border-gray-200 dark:border-slate-800" />

            {/* --- FEED LAPORAN --- */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Laporan Terbaru</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Kejadian di sekitar yang membutuhkan bantuan</p>
                </div>

                {props.page_data.reports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center border border-gray-200 border-dashed bg-gray-50 dark:bg-slate-900/50 rounded-3xl dark:border-slate-800">
                        <div className="p-4 mb-4 rounded-full bg-amber-100 dark:bg-amber-900/20">
                            <IconAlertCircle className="w-10 h-10 text-amber-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-200">Situasi Terkendali</h3>
                        <p className="max-w-sm mt-1 text-sm text-gray-500 dark:text-slate-400">Belum ada laporan aktif saat ini. Tetap waspada dan jaga keselamatan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {props.page_data.reports.map((report) => (
                            <ReportCard key={report.id} report={report} onHelpClick={handleHelpClick} />
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-4">
                <InstallPWAButton />
            </div>
        </div>
    );
}

Dashboard.layout = (page) => <AppLayout children={page} title={'Dashboard'} />;