import { createContext, useContext, useEffect, useState } from 'react';

const initialState = {
	theme: 'system',
	setTheme: () => null,
};

const ThemeProviderContext = createContext(initialState);

export function ThemeProvider({ children, defaultTheme = 'system', storageKey = 'vite-ui-theme', ...props }) {
	const [theme, setThemeState] = useState(defaultTheme);

	useEffect(() => {
		// This will only run on the client-side
		const savedTheme = localStorage.getItem(storageKey) || defaultTheme;
		setThemeState(savedTheme);
	}, [defaultTheme, storageKey]);

	useEffect(() => {
		const root = window.document.documentElement;

		const apply = (value) => {
			root.classList.remove('light', 'dark');
			root.classList.add(value);
		};

		if (theme !== 'system') {
			apply(theme);
			return;
		}

		// "Ikuti sistem" harus ikut LANGSUNG saat HP berganti gelap/terang (mis. iPhone otomatis
		// gelap saat petang), seperti "Sama dengan tema perangkat" di Google Maps - dulu hanya
		// dibaca sekali saat halaman dimuat. Listener di public/js/theme.js tak menolong: ia
		// mensyaratkan localStorage bernilai 'system', padahal pengguna yang belum pernah memilih
		// tema tak punya nilai itu sama sekali.
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const sync = () => apply(media.matches ? 'dark' : 'light');
		sync();
		media.addEventListener('change', sync);
		return () => media.removeEventListener('change', sync);
	}, [theme]);

	const setTheme = (newTheme) => {
		localStorage.setItem(storageKey, newTheme);
		setThemeState(newTheme);
	};

	const value = {
		theme,
		setTheme,
	};

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

	return context;
};
