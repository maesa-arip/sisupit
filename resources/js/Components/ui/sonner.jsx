// #159: tema dibaca dari ThemeProvider MILIK aplikasi (app.jsx). Dulu dari next-themes, yang
// provider-nya tak pernah dipasang - toast selalu ikut tema OS, bukan pilihan di ThemeSwitcher.
import { useTheme } from '@/Components/ThemeProvider';
import { Toaster as Sonner } from 'sonner';

const Toaster = ({ ...props }) => {
	const { theme = 'system' } = useTheme();

	return (
		<Sonner
			theme={theme}
			className="toaster group"
			toastOptions={{
				classNames: {
					toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
					description: 'group-[.toast]:text-muted-foreground',
					actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
					cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
