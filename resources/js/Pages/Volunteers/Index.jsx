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

export default function Index({ volunteers2, filters, ...props }) {
	// State untuk efek loading saat mencari lokasi otomatis
	const [isLocating, setIsLocating] = useState(false);

	// Form Inertia untuk filter pencarian
	const { data, setData, get, processing } = useForm({
		search: '',
		kabupaten: '',
		kecamatan: '',
		desa: '',
		is_my_area: false, // Flag penanda jika pencarian menggunakan GPS
		lat: '',
		lng: '',
	});

	// Handle pencarian manual (Filter / Search bar)
	const handleSearch = (e) => {
		e.preventDefault();
		get(route('front.volunteers.index'), { preserveState: true, preserveScroll: true });
	};

	// Handle tombol "Relawan Di Daerah Saya" (Geolokasi)
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
						kabupaten: '', // Reset filter teks jika pakai GPS
						kecamatan: '',
						desa: '',
					}));

					toast.success('Lokasi Anda ditemukan! Mencari relawan terdekat...');

					// Trigger pencarian (Di aplikasi asli, panggil fungsi get() inertia di sini atau gunakan useEffect)
					setTimeout(() => setIsLocating(false), 1000); // Simulasi loading
				},
				(error) => {
					console.error('Error:', error);
					toast.error('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
					setIsLocating(false);
				},
			);
		} else {
			toast.error('Browser Anda tidak mendukung Geolokasi.');
			setIsLocating(false);
		}
	};

	// DUMMY DATA: Hapus ini jika Anda sudah mem-passing data relawan dari Controller via props
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
			{/* Latar Belakang Ambient Amber */}
			<div className="absolute top-0 left-0 right-0 flex justify-center w-full pointer-events-none -z-10">
				<div className="-mt-10 h-[300px] w-[80vw] max-w-[600px] rounded-[100%] bg-amber-500/10 blur-[80px] dark:bg-amber-500/5"></div>
			</div>

			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Daftar Relawan"
					subtitle="Temukan pahlawan di sekitar Anda atau cari berdasarkan wilayah."
					icon={IconUsersGroup}
				/>
			</div>

			{/* --- PANEL PENCARIAN & FILTER --- */}
			<Card className="overflow-hidden border-gray-200 shadow-sm rounded-3xl dark:border-slate-800">
				<CardContent className="p-5 sm:p-6">
					<form onSubmit={handleSearch} className="flex flex-col gap-5">
						{/* Baris Atas: Tombol "Daerah Saya" & Search Nama */}
						<div className="flex flex-col gap-4 md:flex-row">
							<Button
								type="button"
								onClick={handleMyAreaSearch}
								disabled={isLocating}
								className="flex items-center w-full h-12 gap-2 px-6 transition-colors border shadow-sm shrink-0 rounded-xl border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 md:w-auto"
							>
								{isLocating ? (
									<IconRadar className="w-5 h-5 animate-spin" />
								) : (
									<IconMapPinFilled className="w-5 h-5" />
								)}
								{isLocating ? 'Mencari Lokasi...' : 'Relawan di Daerah Saya'}
							</Button>

							<div className="relative flex-1">
								<div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
									<IconSearch className="w-5 h-5 text-gray-400" />
								</div>
								<Input
									type="text"
									placeholder="Cari nama relawan..."
									className="w-full h-12 border-gray-200 rounded-xl bg-gray-50 pl-11 focus-visible:ring-amber-500 dark:border-slate-800 dark:bg-slate-900"
									value={data.search}
									onChange={(e) => setData('search', e.target.value)}
								/>
							</div>
						</div>

						<hr className="border-gray-100 dark:border-slate-800" />

						{/* Baris Bawah: Filter Wilayah (Menggunakan ComboBox) */}
                        <div className="grid items-end grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-4">
                            
                            {/* Filter Kabupaten */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-slate-400">Kabupaten / Kota</Label>
                                <ComboBox
                                    // Asumsi data array dikirim dari controller via props.page_data.kabupaten
                                    items={props.page_data?.kabupaten || []} 
                                    selectedItem={data.kabupaten}
                                    onSelect={(currentValue) => setData('kabupaten', currentValue)}
                                />
                            </div>

                            {/* Filter Kecamatan */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-slate-400">Kecamatan</Label>
                                <ComboBox
                                    // Asumsi data array dikirim dari controller via props.page_data.kecamatan
                                    items={props.page_data?.kecamatan || []} 
                                    selectedItem={data.kecamatan}
                                    onSelect={(currentValue) => setData('kecamatan', currentValue)}
                                />
                            </div>

                            {/* Filter Desa / Kelurahan */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-slate-400">Desa / Kelurahan</Label>
                                <ComboBox
                                    // Asumsi data array dikirim dari controller via props.page_data.desa
                                    items={props.page_data?.desa || []} 
                                    selectedItem={data.desa}
                                    onSelect={(currentValue) => setData('desa', currentValue)}
                                />
                            </div>

                            {/* Tombol Submit Filter */}
                            <Button 
                                type="submit" 
                                disabled={processing}
                                className="w-full h-10 font-bold text-white rounded-xl bg-amber-600 hover:bg-amber-700"
                            >
                                Terapkan Filter
                            </Button>
                        </div>
					</form>
				</CardContent>
			</Card>

			{/* --- DAFTAR GRID RELAWAN --- */}
			<div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{/* {volunteers.data.length > 0 ? (
					volunteers.data.map((volunteer) => ( */}
                        {volunteers.length > 0 ? (
                    volunteers.map((volunteer) => (
						<Card
							key={volunteer.id}
							className="flex flex-col h-full overflow-hidden transition-all duration-300 border-gray-200 shadow-sm group rounded-3xl bg-white/50 backdrop-blur-sm hover:border-amber-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-amber-700"
						>
							<CardContent className="flex flex-col flex-1 p-6">
								<div className="flex items-start justify-between mb-4">
									{/* Avatar */}
									<div className="flex items-center justify-center overflow-hidden text-xl font-bold border-2 rounded-full shadow-sm h-14 w-14 shrink-0 border-amber-100 bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 dark:border-amber-900 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-500">
										{volunteer.avatar ? (
											<img
												src={volunteer.avatar}
												alt={volunteer.name}
												className="object-cover w-full h-full"
											/>
										) : (
											// volunteer.name.substring(0, 1).toUpperCase()
                                            <IconUsersGroup className="w-6 h-6 text-amber-500" />
										)}
									</div>

									{/* Status Badge */}
									<span
										className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
											volunteer.status === 'Aktif'
												? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400'
												: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'
										}`}
									>
										{volunteer.status}
									</span>
								</div>

								{/* Info Relawan */}
								<div className="flex-1">
									<h3 className="text-lg font-bold text-gray-900 transition-colors line-clamp-1 group-hover:text-amber-600 dark:text-slate-100 dark:group-hover:text-amber-400">
										{volunteer.name}
									</h3>
									<p className="mt-1.5 line-clamp-2 flex items-start gap-1.5 text-sm leading-snug text-gray-500 dark:text-slate-400">
										<IconMapPinFilled className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
										{volunteer.area}
									</p>
								</div>

								{/* Keahlian / Badge Skills */}
								<div className="mb-5 mt-4 flex flex-wrap gap-1.5">
									{volunteer.skills.map((skill, index) => (
										<span
											key={index}
											className="flex items-center gap-1 rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
										>
											<IconMedal className="w-3 h-3 text-amber-500" />
											{skill}
										</span>
									))}
								</div>

								<Button className="w-full text-white transition-colors bg-gray-900 rounded-xl hover:bg-gray-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border dark:border-slate-700" asChild>
    <Link href={route('front.volunteers.show', volunteer.id)} className="flex items-center justify-center gap-2">
        <IconPhone className="w-4 h-4" /> Lihat Profil
    </Link>
</Button>
							</CardContent>
						</Card>
					))
				) : (
					/* State Jika Data Kosong */
					<div className="flex flex-col items-center justify-center p-12 text-center border-2 border-gray-200 border-dashed col-span-full rounded-3xl dark:border-slate-800">
						<IconUsersGroup className="w-16 h-16 mb-4 text-gray-300 dark:text-slate-600" />
						<h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
							Belum ada relawan ditemukan
						</h3>
						<p className="mt-1 text-gray-500 dark:text-slate-400">
							Coba ubah filter pencarian Anda atau perluas jangkauan wilayah.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title="Daftar Relawan" />;
