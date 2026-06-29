import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/button';

export default function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();

	const toggleTheme = () => {
		if (theme === 'dark') {
			setTheme('light');
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		} else {
			setTheme('dark');
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		}
	};

	return (
		<Button
			variant="outline"
			size="icon"
			onClick={toggleTheme}
			aria-label="Toggle Theme"
			// PERBAIKAN: Hapus mr-auto, ubah jadi rounded-full, tambah efek hover Amber
			className="h-10 w-10 shrink-0 rounded-full border-border bg-card text-muted-foreground shadow-sm outline-none transition-all hover:bg-amber-50 hover:text-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:bg-warning/10 dark:hover:text-warning dark:focus-visible:ring-warning"
		>
			{/* LOGIKA UX: Jika dark mode, tampilkan Matahari. Jika light mode, tampilkan Bulan */}
			{theme === 'dark' ? (
				<Sun className="h-5 w-5 transition-transform hover:rotate-90" />
			) : (
				<Moon className="h-5 w-5 transition-transform hover:-rotate-12" />
			)}
		</Button>
	);
}
