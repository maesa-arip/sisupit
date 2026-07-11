/**
 * Header hero untuk halaman publik (Hidran/SKKL/Pos Pemadam) agar serasi dengan landing:
 * kartu gradient merah lembut + chip ikon + judul tebal + subjudul. Contained (dipakai di
 * dalam container max-w-6xl halaman) sehingga tiap halaman cukup satu root element.
 */
export default function PublicPageHeader({ icon: Icon, title, subtitle, eyebrow, action }) {
	return (
		<div className="flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-br from-destructive/5 to-card p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
			<div className="flex items-center gap-4">
				{Icon && (
					<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-destructive shadow-lg shadow-destructive/20 dark:border-neutral-900">
						<Icon className="h-7 w-7 text-white" stroke={1.6} />
					</div>
				)}
				<div className="min-w-0">
					{eyebrow && (
						<span className="text-xs font-bold uppercase tracking-widest text-destructive">
							{eyebrow}
						</span>
					)}
					<h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{title}</h1>
					{subtitle && (
						<p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>
					)}
				</div>
			</div>
			{action && <div className="shrink-0">{action}</div>}
		</div>
	);
}
