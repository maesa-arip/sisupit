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
            <div className="relative z-10 flex flex-col w-full max-w-3xl mx-auto space-y-6">
                
                {/* --- 1. HEADER PROFIL & LOGOUT --- */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between p-5 sm:p-6 mt-4 bg-white dark:bg-[#151515] border border-[#e5e5e5] dark:border-[#262626] rounded-xl shadow-sm gap-4">
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                        <div className="relative flex items-center justify-center w-20 h-20 text-3xl font-semibold text-gray-700 border border-[#e5e5e5] bg-gray-50 dark:bg-[#1f1f1f] dark:border-[#262626] dark:text-gray-300 rounded-full shrink-0">
                            {user.name?.[0]?.toUpperCase() ?? 'U'}
                            {isVolunteer && (
                                <div className="absolute bottom-0 right-0 p-1 text-white bg-blue-600 border-2 border-white rounded-full dark:border-[#151515]">
                                    <IconShieldCheck size={14} stroke={2} />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-center mt-2 text-center sm:items-start sm:text-left sm:mt-0">
                            <h2 className="text-xl font-semibold leading-tight text-gray-900 dark:text-gray-100">{user.name}</h2>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{user.email}</p>
                            <span className={`px-2.5 py-1 mt-2 text-[10px] font-semibold tracking-wider uppercase rounded-md border ${isVolunteer ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-[#111e36] dark:text-[#60a5fa] dark:border-[#1e3a5f]' : 'bg-gray-50 text-gray-600 border-[#e5e5e5] dark:bg-[#1f1f1f] dark:text-gray-400 dark:border-[#262626]'}`}>
                                {isVolunteer ? 'Relawan Aktif' : 'Anggota Masyarakat'}
                            </span>
                        </div>
                    </div>
                    
                    <Link 
                        href={route('logout')} 
                        method="post" 
                        as="button" 
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#b42826] dark:text-[#e54845] transition-colors outline-none bg-transparent hover:bg-red-50 dark:hover:bg-[#2a1313] rounded-md focus-visible:ring-2 focus-visible:ring-[#b42826]/50"
                    >
                        <IconLogout size={16} stroke={2} /> 
                        Keluar
                    </Link>
                </div>

                {/* --- 2. QUICK ACTIONS (Riwayat & Banner) --- */}
                <div className="space-y-4">
                    <Link 
                        href={route('front.reports.index')} 
                        className="flex items-center gap-4 p-4 bg-white dark:bg-[#151515] rounded-xl border border-[#e5e5e5] dark:border-[#262626] shadow-sm hover:border-gray-300 dark:hover:border-[#333] transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
                    >
                        <div className="p-2.5 text-gray-600 bg-gray-50 border border-[#e5e5e5] dark:bg-[#1f1f1f] dark:border-[#262626] dark:text-gray-300 rounded-lg group-hover:bg-gray-100 dark:group-hover:bg-[#262626] transition-colors shrink-0">
                            <IconHistory size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Riwayat Laporan Saya</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pantau status kejadian yang pernah Anda laporkan</p>
                        </div>
                        <IconChevronRight className="w-5 h-5 text-gray-400 transition-colors dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                    </Link>

                    {!isVolunteer && (
                        <div className="flex flex-col items-start justify-between gap-4 p-5 sm:p-6 text-white bg-slate-800 dark:bg-[#101010] border border-slate-700 dark:border-[#262626] rounded-xl sm:flex-row sm:items-center relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="flex items-center gap-2 text-base font-semibold">
                                    <IconAward size={20} /> Panggilan Kemanusiaan
                                </h3>
                                <p className="max-w-md mt-1.5 text-sm leading-relaxed text-slate-300 dark:text-gray-400">
                                    Jadilah pahlawan di sekitar Anda. Daftar sebagai relawan untuk merespons keadaan darurat lebih cepat.
                                </p>
                            </div>
                            <Button 
                                onClick={() => setOpenRelawan(true)}
                                className="relative z-10 w-full text-sm font-medium text-slate-800 bg-white border border-[#e5e5e5] sm:w-auto hover:bg-gray-50 rounded-md h-9 shrink-0 dark:bg-[#1f1f1f] dark:text-gray-200 dark:border-[#333] dark:hover:bg-[#262626]"
                            >
                                Daftar Relawan
                            </Button>
                            <IconShieldCheck size={100} className="absolute pointer-events-none -right-4 -bottom-6 text-white/5 rotate-12" />
                        </div>
                    )}
                </div>

                {/* --- 3. PENGATURAN AKUN --- */}
                <div className="pt-4">
                    <h3 className="flex items-center gap-2 px-1 mb-4 text-sm font-semibold tracking-wider text-gray-900 uppercase dark:text-gray-100">
                        <IconSettings size={18} className="text-gray-500 dark:text-gray-400" /> Pengaturan & Keamanan
                    </h3>
                    
                    <div className="space-y-4">
                        <UpdateProfileInformationForm mustVerifyEmail={props.mustVerifyEmail} status={props.status} />
                        <UpdatePasswordForm />
                        
                        <div className="pt-4">
                            <DeleteUserForm />
                        </div>
                    </div>
                </div>

            </div>

            {/* MODAL DAFTAR RELAWAN */}
            <Dialog open={openRelawan} onOpenChange={setOpenRelawan}>
                <DialogContent className="max-w-md w-[95vw] rounded-xl p-0 bg-white border border-[#e5e5e5] shadow-sm dark:bg-[#151515] dark:border-[#262626]">
                    <DialogHeader className="p-5 border-b border-[#e5e5e5] dark:border-[#262626]">
                        <DialogTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Konfirmasi Pendaftaran</DialogTitle>
                        <DialogDescription className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Dengan mendaftar sebagai relawan, lokasi Anda akan dapat dilacak saat menuju lokasi kejadian untuk membantu pelapor. Pastikan profil (KTP & No. HP) Anda sudah diisi dengan data asli.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 p-5 sm:justify-end">
                        <Button variant="outline" className="border-[#e5e5e5] dark:border-[#333] rounded-md h-9 text-gray-700 dark:text-gray-300 dark:bg-[#151515] hover:bg-gray-50 dark:hover:bg-[#1f1f1f]" onClick={() => setOpenRelawan(false)}>Batal</Button>
                        <Button className="font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 h-9" onClick={handleDaftarRelawan}>
                            Ya, Daftarkan Saya
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

Edit.layout = (page) => <AppLayout children={page} title={'Profil Pengguna'} />;