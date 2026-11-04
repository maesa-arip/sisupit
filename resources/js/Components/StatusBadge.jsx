import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';

// Sumber kebenaran tunggal untuk label & warna status laporan.
// Sebelumnya tiap dashboard (warga/petugas/admin) mendefinisikan ulang map ini
// dengan label & warna BERBEDA untuk status yang sama (mis. TERLAPOR =
// "Butuh Bantuan"/"Darurat"/"Terlapor"). Pakai komponen ini agar konsisten.
// Warna memakai token semantik (destructive/warning/info/success), bukan hex mentah.
// TASK_87 (desain clean minimalis): pil NETRAL + titik warna status - tanpa blok tint pastel.
// Warna status tetap satu sumber di sini (titik), label tidak berubah.
const STATUS_CONFIG = {
	TERLAPOR: { label: 'Laporan Masuk', dot: 'bg-destructive' },
	pending: { label: 'Laporan Terverifikasi', dot: 'bg-warning' },
	handling: { label: 'Penanganan', dot: 'bg-success' },
	resolved: { label: 'Selesai', dot: 'bg-info' },
	ditolak: { label: 'Ditolak', dot: 'bg-muted-foreground/50' },
	// Laporan ganda yang digabung ke kejadian lain (TASK_55). Garis putus-putus = tertaut, bukan berdiri sendiri.
	digabung: { label: 'Digabung', dot: 'bg-muted-foreground/50', className: 'border-dashed' },
};

export default function StatusBadge({ status, className }) {
	const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
	return (
		<Badge
			variant="outline"
			className={cn(
				'gap-1.5 rounded-full border-border bg-card px-2.5 py-0.5 font-semibold text-foreground shadow-none',
				config.className,
				className,
			)}
		>
			<span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0 rounded-full', config.dot)} />
			{config.label}
		</Badge>
	);
}
