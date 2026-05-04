import AppLayout from '@/Layouts/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { 
    IconAward, 
    IconHistory, 
    IconLogout, 
    IconSettings, 
    IconShieldCheck, 
    IconChevronRight,
    IconUserCircle
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { flashMessage } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';

import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit(props) {
    const user = usePage().props.auth.user;
    const [openRelawan, setOpenRelawan] = useState(false);

    // Asumsi: Anda memiliki field role atau is_volunteer di database
    const isVolunteer = user.role === 'volunteer' || user.role === 'admin';

    const handleDaftarRelawan = () => {
        router.put(route('admin.relawan.update', { user: user.id }), {}, {
            onSuccess: () => {
                setOpenRelawan(false);
                const flash = flashMessage('success');
                if (flash) toast[flash.type](flash.message);
                toast.success('Berhasil mendaftar sebagai relawan!');
            },
        });
    };

    return (
        <div className="relative w-full pb-32">
            
            {/* REVISI: Latar Belakang Ambient diubah ke Blue (Menyejukkan/Aman) */}
            {/* <div className="absolute inset-x-0 top-0 h-[400px] overflow-hidden pointer-events-none -z-10">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px]"></div>
            </div> */}

            <div className="relative z-10 flex flex-col w-full max-w-3xl mx-auto space-y-6">
                
                {/* --- 1. HEADER PROFIL & LOGOUT --- */}
                {/* REVISI: Dibuat dalam satu Card agar rapi, dan tombol Logout ditaruh di sini */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between p-6 mt-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[28px] shadow-sm gap-4">
                    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                        {/* REVISI: Avatar menggunakan gradasi Biru/Slate untuk kesan profesional */}
                        <div className="relative flex items-center justify-center w-24 h-24 text-4xl font-extrabold text-blue-700 border-4 border-white rounded-full shadow-md dark:border-slate-800 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-indigo-900/40 dark:text-blue-400 shrink-0">
                            {user.name?.[0]?.toUpperCase() ?? 'U'}
                            {isVolunteer && (
                                <div className="absolute bottom-0 right-0 p-1 text-white bg-blue-500 border-2 border-white rounded-full dark:border-slate-800">
                                    <IconShieldCheck size={16} stroke={2.5} />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-center mt-2 text-center sm:items-start sm:text-left sm:mt-0">
                            <h2 className="text-2xl font-bold leading-tight text-gray-900 dark:text-slate-100">{user.name}</h2>
                            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{user.email}</p>
                            <span className={`px-3 py-1 mt-3 text-[11px] font-bold tracking-wider uppercase rounded-full ${isVolunteer ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                {isVolunteer ? 'Relawan Aktif' : 'Anggota Masyarakat'}
                            </span>
                        </div>
                    </div>
                    
                    {/* Tombol Logout Pindah ke Atas */}
                    <Link 
                        href={route('logout')} 
                        method="post" 
                        as="button" 
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 transition-colors outline-none bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-xl focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                        <IconLogout size={18} stroke={2.5} /> 
                        Keluar
                    </Link>
                </div>

                {/* --- 2. QUICK ACTIONS (Riwayat & Banner) --- */}
                <div className="space-y-4">
                    {/* Riwayat Laporan */}
                    <Link 
                        href={route('front.reports.index')} 
                        className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-[20px] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                        <div className="p-3 text-blue-600 transition-transform duration-300 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-2xl group-hover:scale-110 shrink-0">
                            <IconHistory size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-slate-100">Riwayat Laporan Saya</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Pantau status kejadian yang pernah Anda laporkan</p>
                        </div>
                        <IconChevronRight className="text-gray-400 transition-colors dark:text-slate-500 group-hover:text-blue-500" />
                    </Link>

                    {/* REVISI: Banner hanya muncul jika BUKAN relawan */}
                    {!isVolunteer && (
                        <div className="flex flex-col items-start justify-between gap-4 p-6 text-white shadow-md bg-gradient-to-br from-blue-500 to-sky-600 dark:from-blue-600 dark:to-sky-800 rounded-[20px] sm:flex-row sm:items-center relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="flex items-center gap-2 text-lg font-bold">
                                    <IconAward size={22} /> Panggilan Kemanusiaan
                                </h3>
                                <p className="max-w-md mt-1 text-sm leading-relaxed text-blue-50 opacity-90">
                                    Jadilah pahlawan di sekitar Anda. Daftar sebagai relawan untuk merespons keadaan darurat lebih cepat.
                                </p>
                            </div>
                            <Button 
                                onClick={() => setOpenRelawan(true)}
                                className="relative z-10 w-full font-bold text-blue-700 bg-white shadow-sm sm:w-auto hover:bg-gray-50 rounded-xl h-11 shrink-0"
                            >
                                Daftar Relawan
                            </Button>
                            <IconShieldCheck size={120} className="absolute pointer-events-none -right-6 -bottom-6 text-white/10 rotate-12" />
                        </div>
                    )}
                </div>

                {/* --- 3. PENGATURAN AKUN --- */}
                <div className="pt-6">
                    <h3 className="flex items-center gap-2 px-2 mb-4 text-lg font-bold text-gray-900 dark:text-slate-100">
                        <IconSettings size={22} className="text-gray-500 dark:text-slate-400" /> Pengaturan & Keamanan
                    </h3>
                    
                    <div className="space-y-6">
                        <UpdateProfileInformationForm mustVerifyEmail={props.mustVerifyEmail} status={props.status} className="rounded-[24px]" />
                        <UpdatePasswordForm className="rounded-[24px]" />
                        
                        {/* Zona Berbahaya */}
                        <div className="pt-8">
                            <DeleteUserForm className="rounded-[24px] border-red-200 dark:border-red-900/50" />
                        </div>
                    </div>
                </div>

            </div>

            {/* MODAL DAFTAR RELAWAN (Tetap sama) */}
            <Dialog open={openRelawan} onOpenChange={setOpenRelawan}>
                <DialogContent className="max-w-md w-[95vw] rounded-[24px] dark:bg-slate-900 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold dark:text-slate-100">Konfirmasi Pendaftaran</DialogTitle>
                        <DialogDescription className="mt-2 dark:text-slate-400">
                            Dengan mendaftar sebagai relawan, lokasi Anda akan dapat dilacak saat menuju lokasi kejadian untuk membantu pelapor. Pastikan profil (KTP & No. HP) Anda sudah diisi dengan data asli.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3 mt-4 sm:justify-end">
                        <Button variant="outline" className="border-gray-300 rounded-xl dark:border-slate-700 h-11" onClick={() => setOpenRelawan(false)}>Batal</Button>
                        <Button className="font-bold text-white rounded-xl bg-amber-600 hover:bg-amber-700 h-11" onClick={handleDaftarRelawan}>
                            Ya, Daftarkan Saya
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

Edit.layout = (page) => <AppLayout children={page} title={'Profil Pengguna'} />;