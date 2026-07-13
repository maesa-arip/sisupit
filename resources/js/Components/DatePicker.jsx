import { Button } from '@/Components/ui/button';
import { Calendar } from '@/Components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { cn } from '@/lib/utils';
import { IconCalendar } from '@tabler/icons-react';
import { useState } from 'react';

// Pemilih tanggal shadcn (Popover + Calendar). Menyimpan/mengembalikan string 'YYYY-MM-DD'
// agar cocok dengan validasi `date` Laravel dan pola form Inertia yang memakai string.
const toDate = (v) => (v ? new Date(`${v}T00:00:00`) : undefined);
const toStr = (d) => {
	if (!d) return '';
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
};
const label = (v) => (v ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(toDate(v)) : '');

export default function DatePicker({
	value,
	onChange,
	placeholder = 'Pilih tanggal',
	id,
	className,
	startYear = 2000,
	endYear = new Date().getFullYear(),
}) {
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					id={id}
					variant="outline"
					className={cn(
						'h-10 w-full justify-start rounded-md border-border bg-card px-3 text-left font-normal focus-visible:border-destructive focus-visible:ring-destructive',
						!value && 'text-muted-foreground',
						className,
					)}
				>
					<IconCalendar className="mr-2 h-4 w-4 shrink-0 opacity-70" />
					{value ? label(value) : placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={toDate(value)}
					defaultMonth={toDate(value)}
					captionLayout="dropdown"
					startMonth={new Date(startYear, 0)}
					endMonth={new Date(endYear, 11)}
					onSelect={(d) => {
						onChange(toStr(d));
						setOpen(false);
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}
