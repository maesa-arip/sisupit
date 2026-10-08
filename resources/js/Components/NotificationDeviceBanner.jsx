import { notificationProblem, useFcmDevice } from '@/lib/fcm-device';
import { Link } from '@inertiajs/react';
import { IconAlertTriangle, IconChevronRight } from '@tabler/icons-react';

// Peringatan di dashboard petugas & relawan siaga (#182): tampil HANYA saat bermasalah -
// HP ini (aplikasi) belum terdaftar, izin notifikasinya mati (APK 1.1.8+), atau dibuka di browser dan akun ini belum punya satu HP
// pun yang terdaftar. Saat normal tak menggambar apa pun. Kartu biasa di alur halaman, bukan
// pita sticky/fixed (aturan DashboardMobileShellTest).
export default function NotificationDeviceBanner({ deviceCount }) {
	const device = useFcmDevice();

	const problem = notificationProblem(device);

	let pesan = null;
	if (problem === 'blocked') {
		pesan = {
			title: 'Notifikasi Sisupit diblokir di HP ini',
			body: 'Sirine tidak akan berbunyi sampai izin notifikasi dinyalakan. Periksa sekarang.',
		};
	} else if (problem === 'channels') {
		pesan = {
			title: 'Sebagian notifikasi dimatikan di HP ini',
			body: `Dimatikan di Setelan HP: ${device.notif.blockedChannels.join(', ')}.`,
		};
	} else if (device.status === 'inactive') {
		pesan = {
			title: 'HP ini belum siap menerima sirine',
			body: 'Notifikasi belum terdaftar di HP ini. Periksa sekarang supaya panggilan meluncur tidak terlewat.',
		};
	} else if (device.status === 'browser' && deviceCount === 0) {
		pesan = {
			title: 'Belum ada HP yang menerima sirine',
			body: 'Pasang aplikasi Sisupit di HP Anda lalu masuk dengan akun ini.',
		};
	}

	if (!pesan) return null;

	return (
		<Link
			href={`${route('profile.edit')}#notifikasi-hp`}
			className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 transition-colors hover:bg-warning/15 active:bg-warning/20"
		>
			<IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" stroke={2} />
			<span className="min-w-0 flex-1">
				<span className="block text-sm font-semibold text-foreground">{pesan.title}</span>
				<span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">{pesan.body}</span>
			</span>
			<span className="flex shrink-0 items-center gap-0.5 self-center text-sm font-semibold text-foreground">
				Periksa
				<IconChevronRight className="h-4 w-4" stroke={2} />
			</span>
		</Link>
	);
}
