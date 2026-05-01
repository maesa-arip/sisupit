import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import UserLeafletMap from '@/Components/UserLeafletMap';
import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import {
	IconDroplet,
	IconLoader2,
	IconMapPinFilled,
	IconRadar,
	IconRoute,
	IconSearch,
	IconTool,
} from '@tabler/icons-react';
import { useState } from 'react';

export default function Index({ pumps, filters, ...props }) {
	const [isLocating, setIsLocating] = useState(false);

	const { data, setData, get, processing } = useForm({
		search: filters?.search || '',
		status: filters?.status || 'Semua',
		is_nearest: filters?.is_nearest || false,
		lat: filters?.lat || '',
		lng: filters?.lng || '',
	});

	const handleSearch = (e) => {
		e.preventDefault();
		get(route('front.pumps.index'), { preserveState: true, preserveScroll: true });
	};

	const handleNearestSearch = () => {
		setIsLocating(true);
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					data.is_nearest = true;
					data.lat = latitude;
					data.lng = longitude;
					get(route('front.pumps.index'), {
						preserveState: true,
						preserveScroll: true,
						onFinish: () => setIsLocating(false),
					});
				},
				(error) => {
					console.error('Gagal akses GPS:', error);
					alert('Gagal mendapatkan lokasi. Pastikan izin GPS (Location) aktif di browser Anda.');
					setIsLocating(false);
				},
			);
		} else {
			alert('Browser Anda tidak mendukung fitur lokasi.');
			setIsLocating(false);
		}
	};

	return (
		<div className="relative flex flex-col w-full pb-32 space-y-6">
			<div className="absolute top-0 left-0 right-0 flex justify-center w-full pointer-events-none -z-10">
				<div className="-mt-10 h-[300px] w-[80vw] max-w-[600px] rounded-[100%] bg-amber-500/10 blur-[80px] dark:bg-amber-500/5"></div>
			</div>

			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Lokasi Pompa Air"
					subtitle="Temukan titik hydrant atau pompa air portabel terdekat."
					icon={IconDroplet}
				/>
			</div>

			{/* PERBAIKAN 1: Tambahkan w-full agar layout grid/flexbox flex-row tidak collapse */}
			<div className="flex flex-col items-start w-full gap-6 lg:flex-row">
				{/* KOLOM KIRI */}
				<div className="flex flex-col w-full gap-5 shrink-0 lg:w-5/12 xl:w-1/3">
					<Card className="overflow-hidden border-gray-200 shadow-sm rounded-3xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
						<CardContent className="p-5">
							<form onSubmit={handleSearch} className="flex flex-col gap-4">
								<Button
									type="button"
									onClick={handleNearestSearch}
									disabled={isLocating || processing}
									className="flex items-center w-full h-12 gap-2 text-blue-700 transition-colors border border-blue-200 shadow-sm rounded-xl bg-blue-50 hover:bg-blue-100 dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
								>
									{isLocating ? (
										<IconLoader2 className="w-5 h-5 animate-spin" />
									) : (
										<IconRadar className="w-5 h-5" />
									)}
									{isLocating ? 'Melacak Lokasi Anda...' : 'Cari Pompa Terdekat dari Saya'}
								</Button>

								<div className="relative">
									<div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
										<IconSearch className="w-5 h-5 text-gray-400" />
									</div>
									<Input
										type="text"
										placeholder="Cari nama area atau jalan..."
										className="w-full h-12 bg-white border-gray-200 rounded-xl pl-11 focus-visible:ring-amber-500 dark:border-slate-800 dark:bg-slate-900"
										value={data.search}
										onChange={(e) => setData('search', e.target.value)}
									/>
								</div>

								<div className="flex gap-2 pb-1 overflow-x-auto scrollbar-hide">
									<button
										type="button"
										className="px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm whitespace-nowrap bg-amber-600"
									>
										Semua
									</button>
									<button
										type="button"
										className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg whitespace-nowrap hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
									>
										Siap Pakai
									</button>
									<button
										type="button"
										className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg whitespace-nowrap hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
									>
										Perbaikan
									</button>
								</div>
							</form>
						</CardContent>
					</Card>

					{/* List Daftar Pompa */}
					<div className="flex flex-col gap-3.5 pb-4">
						{pumps.data && pumps.data.length > 0 ? (
							pumps.data.map((pump) => (
								<Card
									key={pump.id}
									className="overflow-hidden transition-all duration-300 border border-gray-100 shadow-sm cursor-pointer group shrink-0 rounded-2xl bg-white/80 backdrop-blur-sm hover:border-amber-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-amber-700"
								>
									<CardContent className="flex flex-row items-center gap-3 p-3 flex-nowrap sm:gap-4 sm:p-4">
										{/* KIRI: Ikon */}
										<div
											className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-inner sm:h-12 sm:w-12 ${
												pump.status === 'Aktif'
													? 'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-400'
													: 'border-orange-100 bg-orange-50 text-orange-600 dark:border-orange-800/50 dark:bg-orange-900/30 dark:text-orange-400'
											}`}
										>
											{pump.status === 'Aktif' ? (
												<IconDroplet className="w-5 h-5 sm:h-6 sm:w-6" />
											) : (
												<IconTool className="w-5 h-5 sm:h-6 sm:w-6" />
											)}
										</div>

										{/* TENGAH: Info Text */}
										<div className="flex-1 w-full min-w-0 py-1">
											<h3 className="truncate text-[14px] font-bold text-gray-900 transition-colors group-hover:text-amber-600 dark:text-slate-100 dark:group-hover:text-amber-400 sm:text-[15px]">
												{pump.name}
											</h3>
											<p className="mt-0.5 truncate text-[12px] text-gray-500 dark:text-slate-400 sm:text-[13px]">
												{pump.address}
											</p>
											<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
												<span
													className={`whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest sm:px-2 sm:text-[10px] ${
														pump.status === 'Aktif'
															? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400'
															: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/30 dark:bg-orange-900/20 dark:text-orange-400'
													}`}
												>
													{pump.status}
												</span>
												<span className="max-w-[80px] truncate border-l border-gray-200 pl-1.5 text-[10px] font-semibold text-gray-400 dark:border-slate-700 dark:text-slate-500 sm:max-w-none sm:pl-2 sm:text-[11px]">
													{pump.type}
												</span>
											</div>
										</div>

										{/* KANAN: Aksi & Jarak */}
										<div className="flex shrink-0 flex-col items-end justify-center gap-1.5 sm:gap-2">
											{pump.distance !== '-' ? (
												<span className="whitespace-nowrap rounded-lg border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-400 sm:py-1 sm:text-[11px]">
													{pump.distance}
												</span>
											) : (
												<span className="h-[20px] sm:h-[22px]"></span>
											)}
											<Button
												variant="ghost"
												size="icon"
												className="text-gray-400 transition-colors rounded-full h-7 w-7 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 sm:h-8 sm:w-8"
											>
												<IconRoute className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
											</Button>
										</div>
									</CardContent>
								</Card>
							))
						) : (
							<div className="flex flex-col items-center justify-center p-10 text-center border-2 border-gray-200 border-dashed rounded-3xl opacity-60 dark:border-slate-800">
								<IconDroplet className="w-12 h-12 mb-2 text-gray-400" />
								<h4 className="text-sm font-bold text-gray-700 dark:text-slate-300">
									Tidak ada data pompa
								</h4>
								<p className="mt-1 text-xs text-gray-500">Coba ubah kata kunci pencarian Anda.</p>
							</div>
						)}
					</div>
				</div>

				{/* --- KOLOM KANAN: Peta Interaktif (Sticky) --- */}
                <div className="flex flex-col w-full gap-3 lg:flex-1 lg:sticky lg:top-[90px]">
                    
                    {/* Header Peta (Sekarang di Luar Peta) */}
                    <div className="flex items-center gap-2 px-1">
                        <IconMapPinFilled className="w-5 h-5 text-amber-500" />
                        <h2 className="text-[16px] font-bold text-gray-800 dark:text-slate-200">Sebaran Titik Pompa</h2>
                    </div>

                    {/* Wrapper Peta */}
                    {/* Tinggi map disesuaikan (dikurangi sedikit) untuk memberi ruang pada judul di atasnya */}
                    <div className="w-full h-[400px] lg:h-[calc(100vh-160px)] rounded-3xl overflow-hidden border border-gray-200 shadow-md dark:border-slate-800 bg-[#e5e3df] dark:bg-[#1a1a1a] relative z-0">
                        <UserLeafletMap markers={pumps.data} />
                    </div>

                </div>
			</div>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title="Lokasi Pompa Air" />;
