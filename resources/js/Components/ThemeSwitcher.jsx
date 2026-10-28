import { Moon, Sun } from 'lucide-react';
import { flushSync } from 'react-dom';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/button';

// Pergantian tema = RIPPLE: tampilan baru membuka sebagai lingkaran yang membesar dari ikon
// (View Transitions API, satu animasi compositor untuk seluruh halaman). Dulu kelas `dark`
// langsung ditukar sehingga ~84 file ber-`transition-all/colors` memudar 150 ms sementara
// sisanya patah seketika - halaman tampak belang. Selama pergantian, kelas `theme-switching`
// di <html> mematikan semua transition (app.css), baik dengan ripple maupun tanpa.
const RIPPLE_MS = 500;

export default function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();

	// Tema yang TAMPIL, bukan pilihan tersimpan: pengguna yang belum pernah memilih punya
	// theme 'system' - dulu ketukan pertama di HP gelap "mengganti" ke gelap (tak terjadi apa-apa)
	// dan ikonnya terbalik.
	const isDark =
		theme === 'dark' ||
		(theme === 'system' &&
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-color-scheme: dark)').matches);

	const toggleTheme = (event) => {
		const root = document.documentElement;
		const next = root.classList.contains('dark') ? 'light' : 'dark';

		const apply = () => {
			// flushSync: ikon & semua konsumen useTheme sudah berganti saat browser memotret tampilan baru.
			flushSync(() => setTheme(next));
			root.classList.remove('light', 'dark');
			root.classList.add(next);
			localStorage.setItem('theme', next);
		};

		root.classList.add('theme-switching');
		const done = () => root.classList.remove('theme-switching');

		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (!document.startViewTransition || reduceMotion) {
			// Browser lama / kurangi gerakan: ganti instan tapi serentak (tanpa belang).
			apply();
			requestAnimationFrame(() => requestAnimationFrame(done));
			return;
		}

		const rect = event.currentTarget.getBoundingClientRect();
		const x = rect.left + rect.width / 2;
		const y = rect.top + rect.height / 2;
		// Jari-jari sampai sudut layar terjauh dari ikon.
		const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

		const transition = document.startViewTransition(apply);
		transition.ready
			.then(() => {
				root.animate(
					{ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
					{
						duration: RIPPLE_MS,
						easing: 'cubic-bezier(0.2, 0, 0, 1)',
						pseudoElement: '::view-transition-new(root)',
					},
				);
			})
			.catch(() => {});
		transition.finished.finally(done);
	};

	return (
		<Button
			variant="outline"
			size="icon"
			onClick={toggleTheme}
			aria-label="Ganti tema"
			// PERBAIKAN: Hapus mr-auto, ubah jadi rounded-full, tambah efek hover Amber
			className="h-10 w-10 shrink-0 rounded-full border-border bg-card text-muted-foreground shadow-sm outline-none transition-all hover:bg-warning/10 hover:text-warning focus-visible:ring-2 focus-visible:ring-warning"
		>
			{/* LOGIKA UX: Jika dark mode, tampilkan Matahari. Jika light mode, tampilkan Bulan */}
			{isDark ? (
				<Sun className="h-5 w-5 transition-transform hover:rotate-90" />
			) : (
				<Moon className="h-5 w-5 transition-transform hover:-rotate-12" />
			)}
		</Button>
	);
}
