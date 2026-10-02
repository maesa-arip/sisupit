import InputError from '@/Components/InputError';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { cn } from '@/lib/utils';
import { IconLock } from '@tabler/icons-react';

// Kerangka form bergrup (TASK_69, apple-design, PENGECUALIAN_ATURAN #5) - dipakai form Pengguna,
// Hydrant & SKKL (asalnya Pages/Admin/Users/Partials/UserFormParts.jsx):
// isian dikelompokkan seperti "inset grouped list" - judul grup kecil di LUAR kartu, isian
// berbaris di DALAM satu kartu bersudut besar yang dipisah garis rambut. Dipakai KEDUA form
// supaya rupanya tak menyimpang lagi; logika form tetap di halaman masing-masing.

export function FormSection({ title, description, children, className }) {
	return (
		<section className={cn('space-y-2', className)}>
			<div className="px-1">
				<h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
				{description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>}
			</div>
			<div
				className={cn(
					'divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm',
					filledFieldsClass,
				)}
			>
				{children}
			</div>
		</section>
	);
}

export function FormField({ label, htmlFor, hint, error, children, className }) {
	return (
		<div className={cn('grid gap-1.5 px-4 py-3.5', className)}>
			{label && (
				<Label htmlFor={htmlFor} className="text-[13px] font-medium">
					{label}
				</Label>
			)}
			{children}
			{hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
			{error && <InputError message={error} />}
		</div>
	);
}

// Wilayah yang dikunci oleh wewenang admin: terbaca sebagai NILAI, bukan isian yang rusak.
export function LockedField({ label, value }) {
	return (
		<FormField label={label}>
			<div className="relative">
				<Input
					readOnly
					value={value || 'Memuat...'}
					className="rounded-xl border-dashed bg-muted/50 pr-10 font-medium text-muted-foreground shadow-none focus-visible:ring-0"
				/>
				<IconLock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-60" />
			</div>
		</FormField>
	);
}

// Pilihan pendek (jenis kelamin) sebagai segmented control - semua pilihan terlihat sekaligus,
// satu ketukan, tanpa membuka daftar.
export function SegmentedControl({ options, value, onChange, ariaLabel }) {
	return (
		<div
			role="radiogroup"
			aria-label={ariaLabel}
			className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-muted p-1"
		>
			{options.map((option) => {
				const selected = String(option.value) === String(value ?? '');
				return (
					<button
						key={option.value}
						type="button"
						role="radio"
						aria-checked={selected}
						onClick={() => onChange(option.value)}
						className={cn(
							'h-9 rounded-lg px-3 text-sm font-medium transition-[color,background-color,box-shadow,transform] duration-200 ease-spring active:scale-[0.97] motion-reduce:active:scale-100',
							selected
								? 'bg-card text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground',
						)}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}

export const fieldInputClass = 'h-11 rounded-xl';

// Isian TERISI ala iOS untuk semua isian di dalam satu grup (TASK_69 bagian 16): tanpa bingkai, latar abu
// lembut, sudut besar - isian tak lagi tampak seperti form web berbingkai di dalam kartu. Ditulis sebagai
// varian keturunan supaya satu kelas di wadah menata input/textarea/pemicu select & combobox sekaligus,
// tanpa menyentuh logika tiap form. Checkbox, radio & input berkas sengaja dikecualikan.
// Kelas harus LITERAL (Tailwind memindai teks sumber), jadi jangan dirangkai saat runtime.
export const filledFieldsClass =
	'[&_input:not([type=checkbox]):not([type=radio]):not([type=file])]:rounded-xl [&_input:not([type=checkbox]):not([type=radio]):not([type=file])]:border-transparent [&_input:not([type=checkbox]):not([type=radio]):not([type=file])]:bg-muted/60 [&_input:not([type=checkbox]):not([type=radio]):not([type=file])]:shadow-none [&_textarea]:rounded-xl [&_textarea]:border-transparent [&_textarea]:bg-muted/60 [&_textarea]:shadow-none [&_[role=combobox]]:rounded-xl [&_[role=combobox]]:border-transparent [&_[role=combobox]]:bg-muted/60 [&_[role=combobox]]:shadow-none';

// Form satu kartu: tiap ANAK LANGSUNG <form> jadi baris bergaris rambut (pola bagian 12) + isian terisi.
export const groupedRowsClass = `divide-y divide-border/70 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0 [&>*]:py-4 ${filledFieldsClass}`;
