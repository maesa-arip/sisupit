// Judul besar ala iOS (TASK_69, apple-design, khusus branch feat/mobile-native-polish): judul tebal
// bertracking rapat yang menjadi jangkar halaman, subjudul abu di bawahnya. Ikon jenis halaman tampil
// sebagai petak bertint HANYA di layar lebar - di ponsel judul besar sendiri sudah cukup sebagai
// penanda lokasi, dan ikon di sebelahnya cuma memakan lebar baris. Dipakai 60 halaman sekaligus.
export default function HeaderTitle({ title, subtitle, icon: Icon }) {
	return (
		<div className="flex min-w-0 items-start gap-3">
			{Icon && (
				<span className="mt-0.5 hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex">
					<Icon className="size-6" stroke={1.75} />
				</span>
			)}
			<div className="min-w-0">
				<h1 className="text-[26px] font-bold leading-tight tracking-tight text-foreground lg:text-3xl">
					{title}
				</h1>
				{subtitle && (
					<p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground lg:text-[15px]">
						{subtitle}
					</p>
				)}
			</div>
		</div>
	);
}
