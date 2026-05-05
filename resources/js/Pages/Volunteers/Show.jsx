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
    // DUMMY DATA
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
            
            {/* Header & Tombol Kembali */}
            <div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
                <HeaderTitle
                    title="Profil Relawan"
                    subtitle="Detail informasi dan kontak relawan."
                    icon={IconUser}
                />
                <Button variant="outline" className="h-9 px-4 rounded-md border-[#e5e5e5] bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-[#262626] dark:bg-[#151515] dark:text-gray-300 dark:hover:bg-[#1f1f1f] shadow-sm transition-colors" asChild>
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
                    <Card className="overflow-hidden border-[#e5e5e5] shadow-sm rounded-xl dark:border-[#262626] dark:bg-[#151515]">
                        
                        {/* Banner Background */}
                        <div className="relative h-24 bg-gray-100 border-b border-[#e5e5e5] dark:bg-[#101010] dark:border-[#262626]">
                            {/* Status Badge */}
                            <div className="absolute top-4 right-4">
                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                                    user.status === 'Aktif' 
                                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-[#112a1d] dark:text-green-500 dark:border-[#1e402c]'
                                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-[#2a1313] dark:text-[#e54845] dark:border-[#4a1c1c]'
                                }`}>
                                    {user.status}
                                </span>
                            </div>
                        </div>

                        <CardContent className="flex flex-col items-center px-5 pt-0 pb-6 text-center">
                            
                            {/* Avatar */}
                            <div className="z-10 flex items-center justify-center mb-3 overflow-hidden text-3xl font-bold border-4 border-white rounded-lg shadow-sm w-24 h-24 -mt-12 bg-gray-50 dark:border-[#151515] dark:bg-[#101010] text-gray-500 shrink-0">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="object-cover w-full h-full" />
                                ) : (
                                    user.name.substring(0, 1).toUpperCase()
                                )}
                            </div>

                            <h2 className="mb-0.5 text-xl font-semibold text-gray-900 dark:text-gray-100">{user.name}</h2>
                            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">Relawan Sisupit</p>

                            {/* Tombol Aksi Cepat */}
                            <div className="flex flex-col w-full gap-2.5">
                                <Button className="w-full h-10 font-medium text-white transition-colors bg-green-600 rounded-md hover:bg-green-700">
                                    <IconBrandWhatsapp className="w-4 h-4 mr-2" /> WhatsApp
                                </Button>
                                <div className="flex gap-2.5">
                                    <Button variant="outline" className="flex-1 h-10 border-[#e5e5e5] rounded-md dark:border-[#333] dark:bg-[#101010] hover:bg-gray-50 dark:hover:bg-[#1f1f1f]">
                                        <IconPhone className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    </Button>
                                    <Button variant="outline" className="flex-1 h-10 border-[#e5e5e5] rounded-md dark:border-[#333] dark:bg-[#101010] hover:bg-gray-50 dark:hover:bg-[#1f1f1f]">
                                        <IconMail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Kartu Statistik Mini */}
                    <Card className="border-[#e5e5e5] shadow-sm rounded-xl dark:border-[#262626] dark:bg-[#151515]">
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Total Bantuan</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{user.reports_handled} <span className="text-sm font-normal text-gray-400">Kasus</span></p>
                            </div>
                            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-red-50 dark:bg-[#2a1313] text-[#b42826] dark:text-[#e54845]">
                                <IconMedal className="w-5 h-5" stroke={1.5} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* KOLOM KANAN: Informasi Detail */}
                <div className="space-y-5 lg:col-span-2">
                    <Card className="overflow-hidden border-[#e5e5e5] shadow-sm rounded-xl dark:border-[#262626] dark:bg-[#151515]">
                        <CardHeader className="pb-4 border-b border-[#e5e5e5] bg-gray-50/50 dark:bg-[#101010] dark:border-[#262626]">
                            <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Informasi Pribadi</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ul className="divide-y divide-[#e5e5e5] dark:divide-[#262626]">
                                
                                <li className="flex items-start gap-4 p-5 transition-colors hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a]">
                                    <div className="p-2 rounded-md bg-red-50 dark:bg-[#2a1313] text-[#b42826] dark:text-[#e54845]">
                                        <IconMapPinFilled className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Area Wilayah</p>
                                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                                            {user.desa}, {user.kecamatan}, {user.kabupaten}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                            {user.address}
                                        </p>
                                    </div>
                                </li>

                                <li className="flex items-center gap-4 p-5 transition-colors hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a]">
                                    <div className="p-2 rounded-md bg-red-50 dark:bg-[#2a1313] text-[#b42826] dark:text-[#e54845]">
                                        <IconPhone className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Nomor Telepon</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.phone}</p>
                                    </div>
                                </li>

                                <li className="flex items-center gap-4 p-5 transition-colors hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a]">
                                    <div className="p-2 rounded-md bg-red-50 dark:bg-[#2a1313] text-[#b42826] dark:text-[#e54845]">
                                        <IconMail className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Alamat Email</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
                                    </div>
                                </li>

                                <li className="flex items-center gap-4 p-5 transition-colors hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a]">
                                    <div className="p-2 rounded-md bg-red-50 dark:bg-[#2a1313] text-[#b42826] dark:text-[#e54845]">
                                        <IconCalendarEvent className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Bergabung Sejak</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.join_date}</p>
                                    </div>
                                </li>

                            </ul>
                        </CardContent>
                    </Card>

                    {/* Kartu Keahlian */}
                    <Card className="overflow-hidden border-[#e5e5e5] shadow-sm rounded-xl dark:border-[#262626] dark:bg-[#151515]">
                        <CardHeader className="pb-4 border-b border-[#e5e5e5] bg-gray-50/50 dark:bg-[#101010] dark:border-[#262626]">
                            <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Keahlian & Kemampuan</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="flex flex-wrap gap-2">
                                {user.skills && user.skills.length > 0 ? (
                                    user.skills.map((skill, index) => (
                                        <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-gray-50 border border-[#e5e5e5] rounded-md dark:bg-[#101010] dark:text-gray-300 dark:border-[#333]">
                                            <IconMedal className="w-4 h-4 text-[#b42826] dark:text-[#e54845]" stroke={1.5} />
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada data keahlian.</p>
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