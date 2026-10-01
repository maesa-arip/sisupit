import { Switch } from '@/Components/ui/switch';
import { cn } from '@/lib/utils';
import { IconLoader2, IconRadar } from '@tabler/icons-react';

// Mode Kesiapan sebagai baris pengaturan ala iOS: ikon, judul, keterangan, lalu SAKELAR (TASK_69,
// apple-design). Dulu dua kartu kembar yang disalin tangan di Pages/Dashboard.jsx (relawan) dan
// Pages/Admin/Dashboard.jsx (pejabat) - TASK_41 sampai mencatat "selalu ubah keduanya"; kini satu
// komponen. Label keadaan tetap "Siaga"/"Non Aktif" (keputusan user 2026-08-26: label = KEADAAN,
// bukan ajakan) dan tampil di samping sakelar supaya artinya tak bergantung warna saja.
export default function StandbyCard({ isStandby, busy = false, onToggle }) {
	return (
		<div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
			<span
				className={cn(
					'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
					isStandby ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
				)}
			>
				<IconRadar className="h-5 w-5" stroke={1.75} />
			</span>
			<div className="min-w-0 flex-1">
				<p className="text-[15px] font-semibold text-foreground">Mode Kesiapan</p>
				<p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
					{isStandby
						? 'Anda menerima notifikasi insiden sesuai wilayah & aturan siaran.'
						: 'Anda tidak menerima notifikasi insiden sampai siaga diaktifkan kembali.'}
				</p>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<span
					className={cn(
						'min-w-[4.5rem] text-right text-[13px] font-medium',
						isStandby ? 'text-destructive' : 'text-muted-foreground',
					)}
				>
					{busy ? (
						<IconLoader2 className="ml-auto h-4 w-4 animate-spin" />
					) : isStandby ? (
						'Siaga'
					) : (
						'Non Aktif'
					)}
				</span>
				<Switch checked={isStandby} disabled={busy} onCheckedChange={onToggle} aria-label="Mode Kesiapan" />
			</div>
		</div>
	);
}
