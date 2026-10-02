// #159: tema dibaca dari ThemeProvider MILIK aplikasi (app.jsx). Dulu dari next-themes, yang
// provider-nya tak pernah dipasang - toast selalu ikut tema OS, bukan pilihan di ThemeSwitcher.
import { useTheme } from '@/Components/ThemeProvider';
import { Toaster as Sonner } from 'sonner';

// apple-design (2026-10-03): toast = notifikasi melayang ala iOS - kartu `material-thick` membulat,
// bayangan dalam, judul 15px semibold, deskripsi 13px. JENIS dibedakan lewat warna IKON (dan bingkai
// tipis untuk galat), bukan latar penuh `richColors`: latar hijau/merah pekat bukan material dan
// menenggelamkan teksnya. Gerak masuk/keluar & geser-untuk-menutup milik sonner (jalur sama, bisa
// disela); kurvanya diganti `ease-spring`. Gaya tombol aksi ada di app.css (selektor sonner-nya
// lebih spesifik daripada utilitas). Gaya bawaan sonner ber-`:where()` sehingga kelas di sini menang.
const Toaster = ({ ...props }) => {
	const { theme = 'system' } = useTheme();

	return (
		<Sonner
			theme={theme}
			className="toaster group"
			// Ponsel: jangan masuk ke bawah poni/status bar (viewport-fit=cover di app.blade.php).
			mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)', left: '1rem', right: '1rem' }}
			toastOptions={{
				classNames: {
					toast: 'material-thick items-start gap-3 rounded-2xl border border-border/60 px-4 py-3.5 text-popover-foreground shadow-[0_12px_32px_-8px_rgb(0_0_0/0.28),0_2px_6px_rgb(0_0_0/0.08)] ease-spring',
					content: 'min-w-0 gap-0.5',
					title: 'text-[15px] font-semibold leading-5 tracking-[-0.01em]',
					description: 'text-[13px] leading-[18px] text-muted-foreground',
					icon: 'mt-px size-5 [&>svg]:size-5',
					success: '[&_[data-icon]]:text-success',
					error: 'border-destructive/40 [&_[data-icon]]:text-destructive',
					warning: '[&_[data-icon]]:text-warning',
					info: '[&_[data-icon]]:text-info',
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
