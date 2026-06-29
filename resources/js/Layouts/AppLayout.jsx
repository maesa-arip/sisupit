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

			<div className="flex min-h-screen w-full bg-background">
				{/* SIDEBAR */}
				<div className="z-20 hidden w-64 shrink-0 border-r border-border bg-card lg:block">
					<div className="sticky top-0 flex h-screen flex-col">
						<div className="flex h-16 shrink-0 items-center border-b border-border px-6">
							{/* <ApplicationLogo /> */}
						</div>
						<div className="flex-1 overflow-y-auto">
							<Sidebar url={url} auth={auth} />
						</div>
					</div>
				</div>

				{/* AREA KONTEN UTAMA */}
				<div className="flex min-h-screen min-w-0 flex-1 flex-col pb-20 lg:pb-0">
					{/* HEADER */}
					<header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md lg:px-8">
						<ApplicationLogo />
						<div className="flex items-center gap-2 lg:gap-4">
							{auth && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button className="relative flex h-9 w-9 items-center justify-center rounded-md outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-muted-foreground/50">
											<IconBell className="h-5 w-5 text-muted-foreground" />
											{unreadCount > 0 && (
												<span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
													{unreadCount > 9 ? '9+' : unreadCount}
												</span>
											)}
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="end"
										className="mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-md"
									>
										<div className="flex items-center justify-between border-b border-border px-4 py-3">
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
										<div className="max-h-80 divide-y divide-border overflow-y-auto">
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
														<div className="min-w-0 flex-1">
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

							{auth?.name && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button className="group flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-muted-foreground/50">
											<div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-sm font-semibold text-muted-foreground shadow-sm transition-transform group-hover:scale-105">
												{auth.avatar ? (
													<img
														src={auth.avatar}
														alt="Avatar"
														className="h-full w-full object-cover"
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
										className="mt-2 w-64 rounded-xl border-border bg-card p-5 shadow-md"
									>
										<div className="flex flex-col items-center space-y-3 text-center">
											<div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-2xl font-semibold text-muted-foreground shadow-sm">
												{auth.avatar ? (
													<img
														src={auth.avatar}
														alt="User Avatar"
														className="h-full w-full object-cover"
													/>
												) : (
													auth.name.substring(0, 1).toUpperCase()
												)}
											</div>
											<div>
												<h4 className="break-words text-base font-semibold text-foreground">
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
							)}

							{/* Divider */}
							<div className="mx-1 h-5 w-px bg-border"></div>

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
					<main className="mx-auto w-full max-w-7xl flex-1">
						<div className="p-4 lg:p-8">{children}</div>
					</main>

					{/* FOOTER */}
					<footer className="mt-auto w-full shrink-0 border-t border-border px-4 py-6 lg:px-8">
						<p className="text-center text-xs font-medium text-muted-foreground lg:text-left">
							&copy; {new Date().getFullYear()} Sisupit. Developed by PT. Tawarin Dimana Saja.
						</p>
					</footer>
				</div>
			</div>

			<MobileBottomNav url={url} auth={auth} />
		</>
	);
}
