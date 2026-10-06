/**
 * `map.fitBounds` yang menunggu peta punya ukuran (#183).
 *
 * Selama kerangka navigasi ditahan (TASK_70, `lib/navigation.js`), halaman tujuan sudah terpasang
 * tapi tersembunyi (display:none), jadi kontainer peta berukuran 0x0. `fitBounds` pada saat itu
 * menghitung skala 0 dan menjatuhkan zoom ke batas minimum (peta dunia). `invalidateSize` yang
 * dipicu `usePageTransition` hanya membetulkan ukuran, tidak mengulang fit - zoom salah tertinggal
 * sampai halaman di-refresh.
 *
 * Bila ukuran peta masih 0, fit ditunda ke event `resize` milik peta (dipancarkan `invalidateSize`
 * saat ukurannya berubah). Permintaan fit berikutnya selagi menunggu menggantikan yang lama.
 */
const pendingFits = new WeakMap();

export function fitBoundsWhenSized(map, bounds, options) {
	const waiting = pendingFits.get(map);
	if (waiting) {
		map.off('resize', waiting);
		pendingFits.delete(map);
	}

	const size = map.getSize();
	if (size.x > 0 && size.y > 0) {
		map.fitBounds(bounds, options);
		return;
	}

	const onResize = (e) => {
		if (!(e.newSize.x > 0 && e.newSize.y > 0)) return;
		map.off('resize', onResize);
		pendingFits.delete(map);
		map.fitBounds(bounds, options);
	};
	pendingFits.set(map, onResize);
	map.on('resize', onResize);
}
