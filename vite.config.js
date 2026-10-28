import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		laravel({
			input: 'resources/js/app.jsx',
			ssr: 'resources/js/ssr.jsx',
			refresh: true,
		}),
		react(),
	],
	build: {
		rollupOptions: {
			output: {
				// Leaflet (#225) chunk sendiri: hash-nya tetap antar-deploy, jadi HP tak mengunduh ulang
				// ~145 KB tiap rilis seperti bila menumpang di app.js yang hash-nya selalu berubah.
				manualChunks: (id) => (/[\\/]node_modules[\\/]leaflet[\\/]/.test(id) ? 'leaflet' : undefined),
			},
		},
	},
	resolve: {
		alias: {
			// Folder aslinya `Components` (kapital), tapi banyak import memakai
			// konvensi shadcn `@/components` (huruf kecil). Di Windows ini lolos
			// (case-insensitive), di Linux gagal. Alias ini memetakan keduanya ke
			// folder yang sama. Dicocokkan sebelum alias `@` dari laravel-vite-plugin.
			'@/components': fileURLToPath(new URL('./resources/js/Components', import.meta.url)),
		},
	},
});
