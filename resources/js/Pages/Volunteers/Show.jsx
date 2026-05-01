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
    // DUMMY DATA: Jika 'volunteer' dari props kosong, kita gunakan data ini untuk preview.
    // Hapus baris ini jika data asli dari controller sudah siap.
    const user = volunteer || {
        name: 'Wayan Dipta',
        email: 'wayan.dipta@example.com',
        phone: '+62 812-3456-7890',
        status: 'Aktif',
        kabupaten: 'Kab. Badung',
        kecamatan: 'Kuta',
        desa: 'Legian',
        address: 'Jl. Raya Legian No. 123, Bali',
        join_date: '12 Agustus 2023',
        avatar: null,
        skills: ['Evakuasi', 'Logistik', 'Medis / P3K'],
        reports_handled: 24,
    };

    return (
        <div className="relative flex flex-col w-full pb-32 space-y-6">
            
            {/* Latar Belakang Ambient Amber */}
            <div className="absolute top-0 left-0 right-0 flex justify-center w-full pointer-events-none -z-10">
                <div className="w-[80vw] max-w-[600px] h-[300px] bg-amber-500/10 dark:bg-amber-500/5 rounded-[100%] blur-[80px] -mt-10"></div>
            </div>

            {/* Header & Tombol Kembali */}
            <div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
                <HeaderTitle
                    title="Profil Relawan"
                    subtitle="Detail informasi dan kontak relawan."
                    icon={IconUser}
                />
                <Button variant="outline" className="border-gray-300 shadow-sm rounded-xl dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-slate-800" asChild>
                    <Link href={route('front.volunteers.index')}>
                        <IconArrowLeft className="w-4 h-4 mr-2" />
                        Kembali
                    </Link>
                </Button>
            </div>

            {/* Layout Utama (Grid) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                
                {/* KOLOM KIRI: Kartu Profil Utama */}
                <div className="space-y-6 lg:col-span-1">
                    <Card className="overflow-hidden border-gray-200 shadow-sm rounded-3xl dark:border-slate-800 dark:bg-slate-900/60 backdrop-blur-sm">
                        
                        {/* Banner Background */}
                        <div className="relative h-32 bg-gradient-to-br from-amber-400 to-orange-600 dark:from-amber-600 dark:to-orange-800">
                            {/* Status Badge mengambang di atas banner */}
                            <div className="absolute top-4 right-4">
                                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm backdrop-blur-md ${
                                    user.status === 'Aktif' 
                                        ? 'bg-green-400/20 text-white border border-green-200/50'
                                        : 'bg-red-400/20 text-white border border-red-200/50'
                                }`}>
                                    {user.status}
                                </span>
                            </div>
                        </div>

                        <CardContent className="flex flex-col items-center px-6 pt-0 pb-6 text-center">
                            
                            {/* Avatar (Min-margin top agar menabrak banner) */}
                            <div className="z-10 flex items-center justify-center mb-4 overflow-hidden text-4xl font-extrabold border-4 border-white rounded-full shadow-md w-28 h-28 -mt-14 dark:border-slate-900 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/60 dark:to-orange-900/60 text-amber-700 dark:text-amber-500 shrink-0">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="object-cover w-full h-full" />
                                ) : (
                                    user.name.substring(0, 1).toUpperCase()
                                )}
                            </div>

                            <h2 className="mb-1 text-2xl font-bold text-gray-900 dark:text-slate-100">{user.name}</h2>
                            <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">Relawan Sisupit</p>

                            {/* Tombol Aksi Cepat */}
                            <div className="flex flex-col w-full gap-3">
                                <Button className="w-full h-12 font-bold text-white transition-colors bg-green-600 rounded-xl hover:bg-green-700">
                                    <IconBrandWhatsapp className="w-5 h-5 mr-2" /> WhatsApp
                                </Button>
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1 h-12 border-gray-300 rounded-xl dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                                        <IconPhone className="w-5 h-5" />
                                    </Button>
                                    <Button variant="outline" className="flex-1 h-12 border-gray-300 rounded-xl dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                                        <IconMail className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Kartu Statistik Mini */}
                    <Card className="border-gray-200 shadow-sm rounded-3xl dark:border-slate-800 dark:bg-slate-900/60">
                        <CardContent className="flex items-center justify-between p-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Bantuan</p>
                                <p className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">{user.reports_handled} <span className="text-base font-normal text-gray-400">Kasus</span></p>
                            </div>
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500">
                                <IconMedal className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* KOLOM KANAN: Informasi Detail */}
                <div className="space-y-6 lg:col-span-2">
                    
                    <Card className="overflow-hidden border-gray-200 shadow-sm rounded-3xl dark:border-slate-800 dark:bg-slate-900/60">
                        <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/50 dark:bg-slate-800/30 dark:border-slate-800">
                            <CardTitle className="text-lg text-gray-800 dark:text-slate-200">Informasi Pribadi</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ul className="divide-y divide-gray-100 dark:divide-slate-800">
                                
                                <li className="flex items-start gap-4 p-6 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400">
                                        <IconMapPinFilled className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-200">Area Wilayah</p>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                                            {user.desa}, {user.kecamatan}, {user.kabupaten}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                                            {user.address}
                                        </p>
                                    </div>
                                </li>

                                <li className="flex items-center gap-4 p-6 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400">
                                        <IconPhone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-200">Nomor Telepon</p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{user.phone}</p>
                                    </div>
                                </li>

                                <li className="flex items-center gap-4 p-6 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400">
                                        <IconMail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-200">Alamat Email</p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{user.email}</p>
                                    </div>
                                </li>

                                <li className="flex items-center gap-4 p-6 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400">
                                        <IconCalendarEvent className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-200">Bergabung Sejak</p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{user.join_date}</p>
                                    </div>
                                </li>

                            </ul>
                        </CardContent>
                    </Card>

                    {/* Kartu Keahlian */}
                    <Card className="overflow-hidden border-gray-200 shadow-sm rounded-3xl dark:border-slate-800 dark:bg-slate-900/60">
                        <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/50 dark:bg-slate-800/30 dark:border-slate-800">
                            <CardTitle className="text-lg text-gray-800 dark:text-slate-200">Keahlian & Kemampuan</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex flex-wrap gap-2">
                                {user.skills && user.skills.length > 0 ? (
                                    user.skills.map((skill, index) => (
                                        <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-amber-800 bg-amber-100/50 border border-amber-200 rounded-xl dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50">
                                            <IconMedal className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Belum ada data keahlian.</p>
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