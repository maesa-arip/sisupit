import { notificationProblem, openNativeNotificationSettings, useFcmDevice } from '@/lib/fcm-device';
import { cn } from '@/lib/utils';
import {
	IconAlertTriangle,
	IconBell,
	IconBellOff,
	IconBellRinging,
	IconCircleCheck,
	IconDeviceMobileOff,
	IconLoader2,
	IconSettings,
} from '@tabler/icons-react';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'sonner';

// Kartu "Notifikasi di HP ini" (#182). Isinya baris-baris untuk Group di Profile/Edit.jsx:
// status HP yang sedang dipakai + tombol uji per bunyi yang diterima perannya (`tests` dari
// DeviceTestNotification::tiersFor). Uji hanya dikirim ke HP ini sendiri.

const STATUS = {
	checking: {
		icon: IconLoader2,
		tint: 'bg-muted text-muted-foreground',
		spin: true,
		title: 'Memeriksa HP ini...',
		subtitle: 'Mendaftarkan HP ini untuk menerima notifikasi.',
	},
	active: {
		icon: IconCircleCheck,
		tint: 'bg-success/10 text-success',
		title: 'Aktif',
		subtitle: 'HP ini terdaftar menerima notifikasi. Coba bunyinya di bawah.',
	},
	inactive: {
		icon: IconAlertTriangle,
		tint: 'bg-warning/15 text-warning',
		title: 'Belum aktif',
		subtitle:
			'HP ini belum terdaftar. Tutup lalu buka lagi aplikasinya, dan pastikan notifikasi Sisupit diizinkan.',
	},
	browser: {
		icon: IconDeviceMobileOff,
		tint: 'bg-muted text-muted-foreground',
		title: 'Dibuka di browser',
		subtitle: 'Notifikasi hanya untuk aplikasi Sisupit di HP. Pasang aplikasinya lalu masuk dengan akun ini.',
	},
};

// Izin notifikasi Android bermasalah (APK 1.1.8+, lib/fcm-device.js) - menimpa status di atas,
// sebab token yang terdaftar tak berguna bila HP membuang notifikasinya diam-diam.
const PROBLEM = {
	blocked: {
		icon: IconBellOff,
		tint: 'bg-destructive/10 text-destructive',
		title: 'Notifikasi diblokir di HP ini',
		subtitle: 'Izin notifikasi Sisupit mati, jadi sirine dan laporan masuk tidak akan muncul di HP ini.',
		action: 'Izinkan notifikasi',
	},
	channels: {
		icon: IconAlertTriangle,
		tint: 'bg-warning/15 text-warning',
		title: 'Sebagian notifikasi dimatikan',
		action: 'Buka setelan notifikasi',
	},
};

export default function NotificationDeviceCard({ tests = [] }) {
	const device = useFcmDevice();
	const [sending, setSending] = useState(null);
	const problem = notificationProblem(device);
	const status =
		problem === 'channels'
			? {
					...PROBLEM.channels,
					subtitle: `Jenis notifikasi ini dimatikan di Setelan HP: ${device.notif.blockedChannels.join(', ')}.`,
				}
			: (PROBLEM[problem] ?? STATUS[device.status] ?? STATUS.checking);
	const StatusIcon = status.icon;
	const canTest = device.status === 'active' && !!device.token && problem !== 'blocked';

	const sendTest = (tier) => {
		setSending(tier);
		axios
			.post(route('fcm.test'), { token: device.token, tier })
			.then((response) => {
				// Akun berprofil belum lengkap dibelokkan ke Lengkapi Profil (200 berisi HTML).
				if (response.data?.status !== 'success') {
					toast.error('Lengkapi profil Anda dulu untuk menerima notifikasi.');
					return;
				}
				toast.success('Notifikasi uji dikirim. Tunggu beberapa detik.');
			})
			.catch((error) => {
				toast.error(
					error.response?.status === 429
						? 'Terlalu sering. Tunggu sebentar lalu coba lagi.'
						: (error.response?.data?.message ?? 'Gagal mengirim notifikasi uji. Coba lagi.'),
				);
			})
			.finally(() => setSending(null));
	};

	return (
		<>
			<div className="flex min-h-[64px] items-start gap-3 px-4 py-3">
				<span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', status.tint)}>
					<StatusIcon size={18} stroke={1.75} className={cn(status.spin && 'animate-spin')} />
				</span>
				<div className="min-w-0 flex-1">
					<p className="text-[15px] font-medium text-foreground">{status.title}</p>
					<p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{status.subtitle}</p>
				</div>
			</div>

			{status.action && (
				<button
					type="button"
					onClick={openNativeNotificationSettings}
					className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted"
				>
					<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<IconSettings size={18} stroke={1.75} />
					</span>
					<span className="min-w-0 flex-1 text-[15px] font-medium text-foreground">{status.action}</span>
				</button>
			)}

			{canTest &&
				tests.map((test) => (
					<button
						key={test.key}
						type="button"
						disabled={sending !== null}
						onClick={() => sendTest(test.key)}
						className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted disabled:opacity-60"
					>
						<span
							className={cn(
								'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
								test.key === 'sirine'
									? 'bg-destructive/10 text-destructive'
									: 'bg-primary/10 text-primary',
							)}
						>
							{test.key === 'sirine' ? (
								<IconBellRinging size={18} stroke={1.75} />
							) : (
								<IconBell size={18} stroke={1.75} />
							)}
						</span>
						<span className="min-w-0 flex-1">
							<span className="block text-[15px] font-medium text-foreground">
								Uji {test.label.toLowerCase()}
							</span>
							<span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
								{test.description}
							</span>
						</span>
						{sending === test.key && (
							<IconLoader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
						)}
					</button>
				))}
		</>
	);
}
