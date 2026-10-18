import { cn } from '@/lib/utils';
import { IconPresentation } from '@tabler/icons-react';

// Akun demo (TASK_81): laporan/akun peragaan. Tampil apa adanya di antrean dan daftar (pilihan user
// 2026-10-18) tetapi tanpa notifikasi ke pengguna asli, jadi penanda ini yang mencegah admin mengira
// laporannya kejadian nyata.
export default function DemoBadge({ title = 'Dibuat akun demo - tidak mengirim notifikasi.', className }) {
	return (
		<span
			title={title}
			className={cn(
				'inline-flex items-center gap-1 rounded-full border border-info/30 bg-info/10 px-2 py-0.5 text-xs font-semibold text-info',
				className,
			)}
		>
			<IconPresentation className="h-3.5 w-3.5 shrink-0" />
			Demo
		</span>
	);
}
