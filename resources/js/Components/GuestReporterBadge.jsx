import { cn } from '@/lib/utils';
import { IconUserQuestion } from '@tabler/icons-react';

// Lapor TANPA LOGIN (TASK_77): laporan tamu = `user_id` kosong + `guest_check` terisi (laporan tamu
// yang sudah disimpan ke akun pelapornya tak lagi ditandai). Nomor HP-nya TIDAK diverifikasi (tanpa
// OTP, keputusan user 2026-10-11), jadi Pusat Komando perlu tahu sebelum memverifikasi: telepon balik
// itulah verifikasinya. `tanpa_captcha` = Cloudflare tak terjangkau saat laporan dikirim, lapis
// captcha tidak dilalui (laporan tetap diterima agar darurat tak terblokir).
export const isGuestReport = (report) => !report?.user_id && !!report?.guest_check;

export default function GuestReporterBadge({ report, className }) {
	if (!isGuestReport(report)) return null;

	const tanpaCaptcha = report.guest_check === 'tanpa_captcha';

	return (
		<span
			title="Dilaporkan tanpa akun. Nomor HP belum diverifikasi - telepon pelapor untuk memastikan."
			className={cn(
				'inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning',
				className,
			)}
		>
			<IconUserQuestion className="h-3.5 w-3.5 shrink-0" />
			Tamu - belum terverifikasi{tanpaCaptcha && ' · tanpa captcha'}
		</span>
	);
}
