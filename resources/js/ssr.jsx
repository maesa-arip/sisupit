import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';
import { route } from '../../vendor/tightenco/ziggy';

// Nama merek tetap di kode, bukan VITE_APP_NAME: nilai itu tertanam saat build dari .env server,
// dan pernah membuat judul tab (serta hasil Google) memakai nama lama yang salah (2026-10-24).
const appName = 'Sisupit';

createServer((page) =>
	createInertiaApp({
		page,
		render: ReactDOMServer.renderToString,
		title: (title) => `${title} - ${appName}`,
		resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
		setup: ({ App, props }) => {
			global.route = (name, params, absolute) =>
				route(name, params, absolute, {
					...page.props.ziggy,
					location: new URL(page.props.ziggy.location),
				});

			return <App {...props} />;
		},
	}),
);
