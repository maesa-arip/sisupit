import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';

// Sumber kebenaran tunggal untuk label & warna status laporan.
// Sebelumnya tiap dashboard (warga/petugas/admin) mendefinisikan ulang map ini
// dengan label & warna BERBEDA untuk status yang sama (mis. TERLAPOR =
// "Butuh Bantuan"/"Darurat"/"Terlapor"). Pakai komponen ini agar konsisten.
// Warna memakai token semantik (destructive/warning/info/success), bukan hex mentah.
const STATUS_CONFIG = {
	TERLAPOR: { label: 'Darurat', className: 'bg-destructive/10 text-destructive border-destructive/30' },
	pending: { label: 'Menunggu', className: 'bg-warning/10 text-warning border-warning/30' },
	handling: { label: 'Penanganan', className: 'bg-info/10 text-info border-info/30' },
	resolved: { label: 'Selesai', className: 'bg-success/10 text-success border-success/30' },
	ditolak: { label: 'Ditolak', className: 'bg-muted text-muted-foreground border-border' },
};

export default function StatusBadge({ status, className }) {
	const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
	return (
		<Badge
			variant="outline"
			className={cn('rounded-md px-2 py-0.5 font-bold shadow-none', config.className, className)}
		>
			{config.label}
		</Badge>
	);
}
