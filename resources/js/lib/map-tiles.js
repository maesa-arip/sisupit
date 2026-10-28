import { MAP_TILE_URL } from '@/lib/utils';

/**
 * Basemap yang mengikuti tema aplikasi, seperti "Sama dengan tema perangkat" di Google Maps.
 *
 * Mode gelap memakai style kembar "sisupit-dark" (docker/tiles/style/sisupit-dark/) lewat env
 * MAP_TILE_URL_DARK, di-inject runtime ke window.MAP_TILE_URL_DARK (app.blade.php). Env kosong =
 * tile terang tetap dipakai, jadi peta tak pernah rusak hanya karena env lupa diisi.
 *
 * Tema dibaca dari kelas `dark` di <html> (ThemeProvider / theme.js), bukan langsung dari
 * prefers-color-scheme, supaya pilihan manual di ThemeSwitcher ikut. Saat kelas berubah, tile
 * diganti di tempat (`setUrl`) tanpa membangun ulang peta; pengamatnya dilepas saat map.remove().
 */
const MAP_TILE_URL_DARK = (typeof window !== 'undefined' && window.MAP_TILE_URL_DARK) || null;

const isDark = () => document.documentElement.classList.contains('dark');

export const currentTileUrl = () => (MAP_TILE_URL_DARK && isDark() ? MAP_TILE_URL_DARK : MAP_TILE_URL);

export function addBaseTiles(map) {
	const layer = window.L.tileLayer(currentTileUrl(), { attribution: '&copy; OpenStreetMap' }).addTo(map);
	if (!MAP_TILE_URL_DARK) return layer;

	const observer = new MutationObserver(() => {
		const url = currentTileUrl();
		if (layer._url !== url) layer.setUrl(url);
	});
	observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
	map.on('unload', () => observer.disconnect());

	return layer;
}
