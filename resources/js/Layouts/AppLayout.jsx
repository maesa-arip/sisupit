import ApplicationLogo from '@/Components/ApplicationLogo';
import Banner from '@/Components/Banner';
import SoundNotificationControl from '@/Components/SoundNotificationControl';
import ThemeSwitcher from '@/Components/ThemeSwitcher';
import { Toaster } from '@/Components/ui/sonner';
import { cn } from '@/lib/utils';
import { Head, router, usePage } from '@inertiajs/react';
import { IconBell } from '@tabler/icons-react';
import { useEffect } from 'react';
import MobileBottomNav from './Partials/MobileBottomNav';
import Sidebar from './Partials/Sidebar';

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';

export default function AppLayout({ title, children }) {
	const { url } = usePage();
	const announcemet = usePage().props.announcemet;
	const auth = usePage().props.auth?.user ?? null;
	const notifications = usePage().props.notifications ?? [];
	const unreadCount = usePage().props.unread_notifications_count ?? 0;

	useEffect(() => {
		if (!auth) return;

		// Kirim token ke server dengan RETRY. Registrasi FCM tidak boleh gagal permanen
		// hanya karena satu hambatan sesaat (jaringan/sesi belum siap) di device baru —
		// ini penyebab "device baru tidak terdaftar di fcm_tokens".
		const postTokenWithRetry = (token, attempt = 1) => {
			const maxAttempts = 4;
			axios
				.post(route('fcm.store'), {
					token: token,
					device_type: 'android',
				})
				.then(() => {
					console.log('Token FCM berhasil disimpan ke database');
				})
				.catch((error) => {
					console.error(
						`Gagal menyimpan token FCM (percobaan ${attempt}/${maxAttempts}):`,
						error.response?.data || error,
					);
					if (attempt < maxAttempts) {
						setTimeout(() => postTokenWithRetry(token, attempt + 1), attempt * 2000);
					}
				});
		};

		// Callback dipanggil oleh WebView Android. JANGAN dihapus saat cleanup: getToken()
		// di sisi native bersifat async dan bisa balik SETELAH user pindah halaman —
		// kalau fungsi ini sudah terhapus, token jatuh ke "undefined" tanpa jejak.
		window.receiveFcmTokenFromNative = (token) => {
			if (!token) {
				console.warn('Token FCM kosong dari native, diabaikan');
				return;
			}
			// Simpan token device agar bisa DILEPAS saat logout (dikirim sebagai body
			// request logout → AuthenticatedSessionController::destroy menghapusnya),
			// supaya HP ini berhenti menerima notifikasi sirine setelah user keluar.
			window.__sisupitFcmToken = token;
			console.log('Token FCM dari Android diterima');
			postTokenWithRetry(token);
		};

		const interval = setInterval(() => {
			if (window.AndroidBridge && typeof window.AndroidBridge.postToken === 'function') {
				console.log('AndroidBridge terdeteksi, meminta token FCM...');
				window.AndroidBridge.postToken('');
				clearInterval(interval);
			}
		}, 500);

		const timeout = setTimeout(() => clearInterval(interval), 15000);

		return () => {
			clearInterval(interval);
			clearTimeout(timeout);
		};
	}, [auth]);

	// useEffect(() => {
	//     if (!auth) return;

	//     // Fungsi ini akan terus mencari sampai BRIDGE ditemukan,
	//     // bahkan jika halaman me-reload atau redirect.
	//     const interval = setInterval(() => {
	//         if (window.AndroidBridge) {
	//             console.log("✅ AndroidBridge terdeteksi, mengirim permintaan token...");
	//             window.AndroidBridge.postToken('');
	//             clearInterval(interval); // Berhenti mencari jika sudah ketemu
	//         }
	//     }, 500);

	//     // Stop mencari setelah 10 detik agar tidak memakan memori
	//     setTimeout(() => clearInterval(interval), 10000);

	//     return () => clearInterval(interval);
	// }, [auth]);
	return (
		<>
			<Head title={title} />
			<Toaster position="top-center" richColors />
			<SoundNotificationControl />

			<div className="flex w-full min-h-screen bg-background">
				{/* SIDEBAR */}
				<div className="z-20 hidden w-64 border-r shrink-0 border-border bg-card lg:block">
					<div className="sticky top-0 flex flex-col h-screen">
						<div className="flex items-center h-16 px-6 border-b shrink-0 border-border">
							{/* <ApplicationLogo /> */}
						</div>
						<div className="flex-1 overflow-y-auto">
							<Sidebar url={url} auth={auth} />
						</div>
					</div>
				</div>

				{/* AREA KONTEN UTAMA */}
				<div className="flex flex-col flex-1 min-w-0 min-h-screen pb-20 lg:pb-0">
					{/* HEADER */}
					<header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 border-b border-border bg-background/95 backdrop-blur-md lg:px-8">
						<ApplicationLogo />
						<div className="flex items-center gap-2 lg:gap-4">
							{auth && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button className="relative flex items-center justify-center transition-colors rounded-md outline-none h-9 w-9 hover:bg-accent focus-visible:ring-2 focus-visible:ring-muted-foreground/50">
											<IconBell className="w-5 h-5 text-muted-foreground" />
											{unreadCount > 0 && (
												<span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
													{unreadCount > 9 ? '9+' : unreadCount}
												</span>
											)}
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="end"
										className="p-0 mt-2 overflow-hidden border shadow-md w-80 rounded-xl border-border bg-card"
									>
										<div className="flex items-center justify-between px-4 py-3 border-b border-border">
											<h4 className="text-sm font-bold text-foreground">Notifikasi</h4>
											{unreadCount > 0 && (
												<button
													onClick={() =>
														router.post(
															route('notifications.readAll'),
															{},
															{ preserveScroll: true },
														)
													}
													className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
												>
													Tandai semua dibaca
												</button>
											)}
										</div>
										<div className="overflow-y-auto divide-y max-h-80 divide-border">
											{notifications.length > 0 ? (
												notifications.map((n) => (
													<button
														key={n.id}
														onClick={() =>
															router.post(
																route('notifications.read', n.id),
																{},
																{ preserveScroll: true },
															)
														}
														className={cn(
															'flex w-full gap-2 px-4 py-3 text-left transition-colors hover:bg-accent',
															!n.read_at && 'bg-muted/50',
														)}
													>
														{!n.read_at && (
															<span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
														)}
														<div className="flex-1 min-w-0">
															<p className="text-xs font-bold text-foreground">
																{n.title}
															</p>
															{n.message && (
																<p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
																	{n.message}
																</p>
															)}
															<p className="mt-1 text-[10px] text-muted-foreground/70">
																{new Date(n.created_at).toLocaleString('id-ID', {
																	day: 'numeric',
																	month: 'short',
																	hour: '2-digit',
																	minute: '2-digit',
																})}
															</p>
														</div>
													</button>
												))
											) : (
												<div className="px-4 py-8 text-center">
													<p className="text-xs text-muted-foreground">
														Belum ada notifikasi.
													</p>
												</div>
											)}
										</div>
									</DropdownMenuContent>
								</DropdownMenu>
							)}

							{/* {auth?.name && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button className="group flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-muted-foreground/50">
											<div className="flex items-center justify-center w-8 h-8 overflow-hidden text-sm font-semibold transition-transform border rounded-md shadow-sm shrink-0 border-border bg-muted text-muted-foreground group-hover:scale-105">
												{auth.avatar ? (
													<img
														src={auth.avatar}
														alt="Avatar"
														className="object-cover w-full h-full"
													/>
												) : (
													auth.name.substring(0, 1).toUpperCase()
												)}
											</div>
											<span className="hidden max-w-[120px] truncate text-sm font-medium text-foreground sm:block">
												{auth.name}
											</span>
										</button>
									</DropdownMenuTrigger>

									<DropdownMenuContent
										align="end"
										className="w-64 p-5 mt-2 shadow-md rounded-xl border-border bg-card"
									>
										<div className="flex flex-col items-center space-y-3 text-center">
											<div className="flex items-center justify-center w-16 h-16 overflow-hidden text-2xl font-semibold border rounded-full shadow-sm border-border bg-muted text-muted-foreground">
												{auth.avatar ? (
													<img
														src={auth.avatar}
														alt="User Avatar"
														className="object-cover w-full h-full"
													/>
												) : (
													auth.name.substring(0, 1).toUpperCase()
												)}
											</div>
											<div>
												<h4 className="text-base font-semibold break-words text-foreground">
													{auth.name}
												</h4>
												<p className="mt-0.5 break-words text-xs text-muted-foreground">
													{auth.email}
												</p>
											</div>
											{auth.role && auth.role.length > 0 && (
												<div className="mt-2 flex flex-wrap justify-center gap-1.5">
													{auth.role.map((role_name, i) => (
														<span
															key={i}
															className="rounded-md border border-border bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
														>
															{role_name}
														</span>
													))}
												</div>
											)}
										</div>
									</DropdownMenuContent>
								</DropdownMenu>
							)} */}

							{/* Divider */}
							<div className="w-px h-5 mx-1 bg-border"></div>

							<ThemeSwitcher />
						</div>
					</header>

					{/* BANNER GLOBAL */}
					{announcemet && announcemet.is_active == 1 && (
						<div className="w-full">
							<Banner message={announcemet.message} url={announcemet.url} />
						</div>
					)}

					{/* MAIN CONTENT */}
					<main className="flex-1 w-full mx-auto max-w-7xl">
						<div className="p-4 lg:p-8">{children}</div>
					</main>

					{/* FOOTER */}
					<footer className="w-full px-4 py-6 mt-auto border-t shrink-0 border-border lg:px-8">
						<p className="text-xs font-medium text-center text-muted-foreground lg:text-left">
							&copy; {new Date().getFullYear()} Sisupit. Developed by PT. Tawarin Dimana Saja.
						</p>
					</footer>
				</div>
			</div>

			<MobileBottomNav url={url} auth={auth} />
		</>
	);
}
