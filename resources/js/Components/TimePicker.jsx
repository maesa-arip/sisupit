import { Button } from '@/Components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { cn } from '@/lib/utils';
import { IconClock } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

// Pemilih jam (Popover + dua kolom angka), kembaran DatePicker.jsx. Menyimpan/mengembalikan
// string 'HH:mm' agar cocok dengan pola form Inertia yang memakai string.
//
// Sengaja TIDAK memakai <input type="time">: pemilih bawaan itu diserahkan ke dialog NATIVE
// milik WebView, dan di APK Android mengetuknya menutup aplikasi (FINDINGS #108). Berkas ini
// murni JavaScript sehingga tidak ada dialog native yang dibuka di permukaan mana pun.
// JANGAN menggantinya kembali ke input native.
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
// Menit penuh 0-59, bukan kelipatan 5: kolomnya juga dipakai MENYUNTING berita acara lama yang
// jamnya sudah tercatat lewat input native, dan grid berkelipatan akan membuang menitnya diam-diam.
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const split = (v) => {
	const m = /^(\d{2}):(\d{2})$/.exec(v ?? '');
	return m ? { hour: m[1], minute: m[2] } : { hour: '', minute: '' };
};

export default function TimePicker({
	value,
	onChange,
	placeholder = 'Pilih jam',
	id,
	className,
	'aria-label': ariaLabel,
}) {
	const [open, setOpen] = useState(false);
	const { hour, minute } = split(value);
	const hourRef = useRef(null);
	const minuteRef = useRef(null);

	// Bawa pilihan yang sedang berlaku ke dalam pandangan saat panel dibuka — tanpa ini,
	// jam 21.45 mengharuskan pengguna menggulir dua kolom dari nol tiap kali membukanya.
	// Digulir lewat `scrollTop` KOLOMNYA sendiri, bukan scrollIntoView(): yang terakhir ikut
	// menggulung setiap leluhur yang bisa digulung, jadi membuka panel akan menggeser halaman
	// di belakangnya.
	useEffect(() => {
		if (!open) return;
		const frame = window.requestAnimationFrame(() => {
			[hourRef, minuteRef].forEach((ref) => {
				const item = ref.current;
				const column = item?.parentElement;
				if (!item || !column) return;
				column.scrollTop = item.offsetTop - column.clientHeight / 2 + item.clientHeight / 2;
			});
		});
		return () => window.cancelAnimationFrame(frame);
	}, [open]);

	// Kolom yang belum dipilih jatuh ke '00' supaya satu ketukan sudah menghasilkan jam yang sah.
	const pick = (nextHour, nextMinute) => onChange(`${nextHour || '00'}:${nextMinute || '00'}`);

	const column = (items, selected, onPick, activeRef) => (
		<div className="max-h-56 w-16 overflow-y-auto p-1" role="listbox" aria-label="Pilihan">
			{items.map((item) => {
				const isActive = item === selected;
				return (
					<button
						key={item}
						ref={isActive ? activeRef : undefined}
						type="button"
						role="option"
						aria-selected={isActive}
						onClick={() => onPick(item)}
						className={cn(
							'w-full rounded-md py-1.5 text-center text-sm tabular-nums transition-colors',
							isActive
								? 'bg-destructive font-semibold text-destructive-foreground'
								: 'text-foreground hover:bg-accent',
						)}
					>
						{item}
					</button>
				);
			})}
		</div>
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					id={id}
					aria-label={ariaLabel}
					variant="outline"
					className={cn(
						'h-10 w-full justify-start rounded-md border-border bg-card px-3 text-left font-normal focus-visible:border-destructive focus-visible:ring-destructive',
						!value && 'text-muted-foreground',
						className,
					)}
				>
					<IconClock className="mr-2 h-4 w-4 shrink-0 opacity-70" />
					{value ? `${hour}.${minute}` : placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<div className="flex items-stretch divide-x divide-border">
					{column(HOURS, hour, (h) => pick(h, minute), hourRef)}
					{column(MINUTES, minute, (m) => pick(hour, m), minuteRef)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
