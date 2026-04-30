import AppLayout from '@/Layouts/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { 
    IconAward, 
    IconHistory, 
    IconLogout, 
    IconSettings, 
    IconShieldCheck, 
    IconChevronRight
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

    const handleDaftarRelawan = () => {
        router.put(route('admin.relawan.update', { user: user.id }), {}, {
            onSuccess: () => {
                setOpenRelawan(false);
                const flash = flashMessage('success'); // asumsikan utilitas flash Anda berjalan
                if (flash) toast[flash.type](flash.message);
                toast.success('Berhasil mendaftar sebagai relawan!');
            },
        });
    };

    return (
        <div className="relative w-full pb-32">
            
            {/* Latar Belakang Dekoratif Ambient Amber terpotong agar tidak overflow */}
            <div className="absolute inset-x-0 top-0 h-[400px] overflow-hidden pointer-events-none -z-10">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/15 dark:bg-amber-500/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 flex flex-col w-full max-w-3xl mx-auto space-y-6">
                
                {/* --- 1. HEADER PROFIL (FOTO & NAMA) --- */}
                <div className="flex flex-col items-center pt-8 pb-6">
                    <div className="relative flex items-center justify-center mb-4 text-4xl font-extrabold border-4 border-white rounded-full shadow-lg w-28 h-28 dark:border-slate-900 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-orange-900/40 text-amber-700 dark:text-amber-500">
                        {user.name?.[0]?.toUpperCase() ?? 'U'}
                        {/* Centang Biru / Verified (Opsional) */}
                        <div className="absolute p-1 text-white bg-blue-500 border-2 border-white rounded-full bottom-1 right-1 dark:border-slate-900">
                            <IconShieldCheck size={16} stroke={2.5} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{user.name}</h2>
                    <p className="mt-1 text-sm font-medium text-gray-500 dark:text-slate-400">{user.email}</p>
                    <span className="px-3 py-1 mt-3 text-xs font-bold tracking-wider text-gray-600 uppercase bg-gray-100 rounded-full dark:bg-slate-800 dark:text-slate-300">
                        Anggota Masyarakat
                    </span>
                </div>

                {/* --- 2. BANNER UPGRADE: DAFTAR RELAWAN --- */}
                <div className="flex flex-col items-start justify-between gap-4 p-6 text-white shadow-lg bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 rounded-3xl sm:flex-row sm:items-center">
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold">
                            <IconAward size={22} /> Panggilan Kemanusiaan
                        </h3>
                        <p className="max-w-sm mt-1 text-sm leading-relaxed text-amber-50 opacity-90">
                            Jadilah pahlawan di sekitar Anda. Daftar sebagai relawan untuk membantu menindaklanjuti laporan kejadian darurat.
                        </p>
                    </div>
                    <Button 
                        onClick={() => setOpenRelawan(true)}
                        className="w-full font-bold bg-white sm:w-auto hover:bg-gray-50 text-amber-600 rounded-xl h-11 shrink-0"
                    >
                        Daftar Relawan
                    </Button>
                </div>

                {/* --- 3. MENU RIWAYAT --- */}
                <div>
                    <Link 
                        href={route('front.reports.index')} /* Sesuaikan dengan route history laporan Anda */
                        className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                        <div className="p-3 text-blue-600 transition-transform duration-300 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-2xl group-hover:scale-110">
                            <IconHistory size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-slate-100">Laporan Saya</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Lihat status dan riwayat kejadian yang Anda laporkan</p>
                        </div>
                        <IconChevronRight className="text-gray-400 transition-colors dark:text-slate-500 group-hover:text-amber-500" />
                    </Link>
                </div>

                <hr className="my-4 border-gray-200 dark:border-slate-800" />

                {/* --- 4. FORM PENGATURAN AKUN --- */}
                <div className="space-y-6">
                    <h3 className="flex items-center gap-2 px-1 text-lg font-bold text-gray-900 dark:text-slate-100">
                        <IconSettings size={22} className="text-amber-500" /> Pengaturan Akun
                    </h3>
                    
                    <UpdateProfileInformationForm mustVerifyEmail={props.mustVerifyEmail} status={props.status} />
                    <UpdatePasswordForm />
                    <DeleteUserForm />
                </div>

               <div className="pt-8 pb-4">
                    <Link 
                        href={route('logout')} 
                        method="post" 
                        as="button" 
                        className="flex items-center justify-center w-full gap-2 p-4 font-bold text-white transition-all bg-red-500 shadow-sm outline-none hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 rounded-2xl hover:shadow-md focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                    >
                        <IconLogout size={22} stroke={2.5} /> 
                        <span className="text-base tracking-wide">Keluar Aplikasi</span>
                    </Link>
                </div>

            </div>

            {/* MODAL DAFTAR RELAWAN */}
            <Dialog open={openRelawan} onOpenChange={setOpenRelawan}>
                <DialogContent className="max-w-md rounded-[28px] dark:bg-slate-900 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold dark:text-slate-100">Konfirmasi Pendaftaran</DialogTitle>
                        <DialogDescription className="mt-2 dark:text-slate-400">
                            Dengan mendaftar sebagai relawan, lokasi Anda akan dapat dilacak saat menuju lokasi kejadian untuk membantu pelapor. Pastikan profil Anda sudah diisi dengan data asli.
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