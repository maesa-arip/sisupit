import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { toast } from 'sonner';
import { ThemeProvider } from './Components/ThemeProvider';
import { focusFirstError } from './lib/focus-first-error';
import { installNavigationTracking } from './lib/navigation';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// 413 = kiriman melewati batas server (#132). Datang dari DUA lapis - Nginx
// (client_max_body_size) atau Laravel (PostTooLargeException saat PHP post_max_size
// terlewati) - dan keduanya berupa halaman HTML, bukan respons Inertia, jadi tanpa ini
// pengguna melihat modal galat mentah "413 Request Entity Too Large" dan isian formnya
// terasa hilang. Ditangani di KLIEN karena ValidatePostSize berjalan SEBELUM session
// dimulai: back()->with() di bootstrap/app.php tak bisa membawa pesannya.
// preventDefault() pada event `invalid` mencegah modal itu; form tetap utuh di layar.
if (typeof window !== 'undefined') {
	router.on('invalid', (event) => {
		if (event.detail.response?.status !== 413) return;
		event.preventDefault();
		toast.error('Ukuran foto terlalu besar. Kurangi jumlah foto atau pilih foto lain, lalu simpan lagi.');
	});

	// Galat validasi di form mana pun -> fokus & gulir ke isian teratas yang bermasalah.
	// Ditunggu satu frame supaya <InputError> yang baru sempat dirender React.
	router.on('error', () => requestAnimationFrame(focusFirstError));

	// Navigasi instan (TASK_70): kerangka halaman tujuan + menu aktif langsung saat diketuk,
	// dan cache prefetch dibuang setiap kali data berubah. Lihat lib/navigation.js.
	installNavigationTracking();
}

createInertiaApp({
	title: (title) => `${title} - ${appName}`,
	resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
	setup({ el, App, props }) {
		if (import.meta.env.SSR) {
			hydrateRoot(el, <App {...props} />);
			return;
		}
		const appElement = (
			<ThemeProvider defaultTheme="system" storageKey="current-theme">
				<App {...props} />
			</ThemeProvider>
		);

		createRoot(el).render(appElement);
	},
	progress: {
		color: '#f97316',
		includeCSS: true,
		showSpinner: true,
	},
});
