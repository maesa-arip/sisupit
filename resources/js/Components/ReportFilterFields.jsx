import DatePicker from '@/Components/DatePicker';
import { Combobox } from '@/Components/ui/combobox';
import { Label } from '@/Components/ui/label';
import { cn } from '@/lib/utils';

// Saringan lanjutan daftar laporan (TASK_78) - dipakai /admin/reports (+ versi pemantau) dan
// Peta Pemantauan. Nilainya kamus server `Report::PERIODE_OPTIONS` / `JENIS_FILTER` /
// `PER_PAGE_OPTIONS`; nilai asing dibuang server (normalizeListFilters), jadi menambah pilihan
// berarti mengubah keduanya. Periode = tanggal laporan MASUK, dihitung server dalam WITA.
export const PERIODE_OPTIONS = [
	{ value: '', label: 'Semua waktu' },
	{ value: 'hari_ini', label: 'Hari ini' },
	{ value: '7_hari', label: '7 hari' },
	{ value: '30_hari', label: '30 hari' },
	{ value: '90_hari', label: '90 hari' },
	{ value: 'rentang', label: 'Rentang tanggal' },
];

export const JENIS_OPTIONS = [
	{ value: '', label: 'Semua jenis' },
	{ value: 'kebakaran', label: 'Kebakaran' },
	{ value: 'non_kebakaran', label: 'Non-kebakaran' },
];

export const PER_PAGE_OPTIONS = [10, 25, 50];

const PILL_SIZE = {
	md: 'px-3 py-1.5 text-[13px]',
	sm: 'px-2.5 py-1 text-xs',
};

export function FilterPill({ active, children, onClick, size = 'md' }) {
	return (
		<button
			type="button"
			aria-pressed={active}
			onClick={onClick}
			className={cn(
				'inline-flex shrink-0 items-center whitespace-nowrap rounded-full border font-semibold transition-colors active:bg-muted',
				PILL_SIZE[size],
				active
					? 'border-primary/20 bg-primary/10 text-primary'
					: 'border-input bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
			)}
		>
			{children}
		</button>
	);
}

const shortDate = (v) =>
	v ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(`${v}T00:00:00`)) : '...';

function districtLabel(options, code) {
	const item = options.find((d) => d.code === code);
	return item ? `Kec. ${item.name}` : null;
}

/**
 * Label saringan yang sedang aktif (selain bawaan), untuk chip ringkasan yang bisa dihapus satu
 * per satu. `defaults` = nilai bawaan halaman (peta: periode '7_hari'), yang tak perlu disebut.
 */
export function activeReportFilters(
	values,
	{ districtOptions = [], periodeOptions = PERIODE_OPTIONS, defaults = {} } = {},
) {
	const chips = [];
	const periode = values.periode ?? '';
	if (periode && periode !== (defaults.periode ?? '')) {
		if (periode === 'rentang') {
			if (values.from || values.to) {
				chips.push({ key: 'periode', label: `${shortDate(values.from)} - ${shortDate(values.to)}` });
			}
		} else {
			const label = periodeOptions.find((o) => o.value === periode)?.label;
			chips.push({ key: 'periode', label: periode === 'hari_ini' ? label : `${label} terakhir` });
		}
	}
	if (values.jenis) {
		chips.push({ key: 'jenis', label: JENIS_OPTIONS.find((o) => o.value === values.jenis)?.label });
	}
	if (values.kecamatan) {
		chips.push({ key: 'kecamatan', label: districtLabel(districtOptions, values.kecamatan) ?? 'Kecamatan' });
	}
	return chips;
}

/**
 * Isian saringan. `onChange(patch)` menerima sebagian nilai; mengganti periode ke preset
 * mengosongkan rentang tanggal supaya URL tak membawa dua makna sekaligus.
 */
export default function ReportFilterFields({
	values,
	onChange,
	districtOptions = [],
	periodeOptions = PERIODE_OPTIONS,
	showPerPage = false,
	size = 'md',
	periodeHint,
	idPrefix = 'report-filter',
	// Kelas panel popover DatePicker/Combobox - peta layar penuh (z-[200]) butuh z-index lebih tinggi.
	popoverClassName,
}) {
	const periode = values.periode ?? '';
	const rangeInvalid = Boolean(values.from && values.to && values.to < values.from);
	const labelClass = 'text-xs font-semibold text-muted-foreground';

	return (
		<div className="space-y-3">
			<div className="space-y-1.5">
				<p className={labelClass}>Periode laporan masuk</p>
				<div className="flex flex-wrap gap-1.5">
					{periodeOptions.map((option) => (
						<FilterPill
							key={option.value || 'semua'}
							size={size}
							active={periode === option.value}
							onClick={() =>
								onChange(
									option.value === 'rentang'
										? { periode: 'rentang' }
										: { periode: option.value, from: '', to: '' },
								)
							}
						>
							{option.label}
						</FilterPill>
					))}
				</div>
				{periode === 'rentang' && (
					<div className={cn('grid grid-cols-1 gap-2 pt-1', size === 'md' && 'sm:grid-cols-2')}>
						<div className="space-y-1">
							<Label htmlFor={`${idPrefix}-from`} className="text-xs font-normal text-muted-foreground">
								Dari tanggal
							</Label>
							<DatePicker
								id={`${idPrefix}-from`}
								value={values.from ?? ''}
								onChange={(from) => onChange({ from })}
								placeholder="Awal"
								contentClassName={popoverClassName}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor={`${idPrefix}-to`} className="text-xs font-normal text-muted-foreground">
								Sampai tanggal
							</Label>
							<DatePicker
								id={`${idPrefix}-to`}
								value={values.to ?? ''}
								onChange={(to) => onChange({ to })}
								placeholder="Akhir"
								contentClassName={popoverClassName}
							/>
						</div>
					</div>
				)}
				{rangeInvalid ? (
					<p className="text-xs text-destructive">
						Tanggal akhir sebelum tanggal awal - keduanya akan ditukar.
					</p>
				) : (
					periodeHint && <p className="text-xs text-muted-foreground">{periodeHint}</p>
				)}
			</div>

			<div className="space-y-1.5">
				<p className={labelClass}>Jenis kejadian</p>
				<div className="flex flex-wrap gap-1.5">
					{JENIS_OPTIONS.map((option) => (
						<FilterPill
							key={option.value || 'semua'}
							size={size}
							active={(values.jenis ?? '') === option.value}
							onClick={() => onChange({ jenis: option.value })}
						>
							{option.label}
						</FilterPill>
					))}
				</div>
			</div>

			{/* Akun yang terkunci satu kecamatan tak diberi pilihan (server mengirim daftar kosong). */}
			{districtOptions.length > 0 && (
				<div className="space-y-1.5">
					<p className={labelClass}>Kecamatan</p>
					<Combobox
						items={districtOptions}
						value={values.kecamatan ?? ''}
						onChange={(kecamatan) => onChange({ kecamatan })}
						placeholder="Semua kecamatan"
						emptyText="Kecamatan tidak ditemukan."
						itemDescription={
							districtOptions.some((d) => d.city)
								? (item) => <span className="truncate text-xs text-muted-foreground">{item.city}</span>
								: undefined
						}
						className="rounded-xl bg-card"
						contentClassName={popoverClassName}
					/>
				</div>
			)}

			{showPerPage && (
				<div className="space-y-1.5">
					<p className={labelClass}>Baris per halaman</p>
					<div className="flex flex-wrap gap-1.5">
						{PER_PAGE_OPTIONS.map((n) => (
							<FilterPill
								key={n}
								size={size}
								active={Number(values.load ?? PER_PAGE_OPTIONS[0]) === n}
								onClick={() => onChange({ load: n })}
							>
								{n}
							</FilterPill>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
