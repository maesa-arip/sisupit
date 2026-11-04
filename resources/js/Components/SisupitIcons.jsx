/**
 * Ikon khas Sisupit (TASK_87, desain clean minimalis - branch feat/desain-clean-minimalis + dev).
 *
 * Dibuat dari path yang SAMA dengan halaman Ikon di desain FigCraft (`Documents/Sisupit Desain/ikon.py`):
 * grid 24 px, garis membulat, `stroke="currentColor"` + `fill="none"` - jadi ikut warna teks seperti
 * Tabler dan tak bisa mengulang #106 (aset berwarna sendiri). Kontrak props meniru @tabler/icons-react
 * (`size`, `stroke`, `className`). Kebakaran & Armada TIDAK di sini: keduanya tetap Tabler `IconFlame` dan
 * `IconFiretruck` seperti production (permintaan user 2026-11-04).
 */
import { forwardRef } from 'react';

function createSisupitIcon(displayName, paths) {
	const Icon = forwardRef(function SisupitIcon({ size = 24, stroke = 2, className, ...props }, ref) {
		return (
			<svg
				ref={ref}
				xmlns="http://www.w3.org/2000/svg"
				width={size}
				height={size}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={stroke}
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
				className={className}
				{...props}
			>
				{paths.map((d) => (
					<path key={d} d={d} />
				))}
			</svg>
		);
	});
	Icon.displayName = displayName;
	return Icon;
}

/** Hydrant */
export const IconSisupitHydrant = createSisupitIcon('IconSisupitHydrant', [
	'M10.5 3h3',
	'M12 3v1.5',
	'M8 8.5a4 4 0 0 1 8 0',
	'M6.5 8.5h11',
	'M8 8.5V19',
	'M16 8.5V19',
	'M8 12.5H5.5v3H8',
	'M16 12.5h2.5v3H16',
	'M10.5 14a1.5 1.5 0 1 0 3.0 0a1.5 1.5 0 1 0 -3.0 0',
	'M6 19h12v2H6z',
]);

/** SKKL / pompa */
export const IconSisupitSkkl = createSisupitIcon('IconSisupitSkkl', [
	'M3.5 9.5h10a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 2 16v-5a1.5 1.5 0 0 1 1.5-1.5z',
	'M6.5 13.5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
	'M6 9.5V7.5h5v2',
	'M15 12h2.5a2 2 0 0 1 2 2v1',
	'M19.5 17.5c.9 1.1 1.3 1.8 1.3 2.3a1.3 1.3 0 0 1-2.6 0c0-.5.4-1.2 1.3-2.3z',
	'M4.5 17.5V20',
	'M12.5 17.5V20',
]);

/** Pos pemadam */
export const IconSisupitPos = createSisupitIcon('IconSisupitPos', [
	'M3 10.5 12 5l9 5.5',
	'M5 9.3V20h14V9.3',
	'M9 20v-6h6v6',
	'M9 16.5h6',
	'M3 20h18',
	'M12 2.5V5',
]);

/** Regu */
export const IconSisupitRegu = createSisupitIcon('IconSisupitRegu', [
	'M4 15a8 8 0 0 1 16 0',
	'M2.5 15h19',
	'M3.5 15v1a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5v-1',
	'M12 7v4',
	'M10 11h4v2.5h-4z',
]);

/** Relawan */
export const IconSisupitRelawan = createSisupitIcon('IconSisupitRelawan', [
	'M12 11.5 9.5 9a1.77 1.77 0 1 1 2.5-2.5 1.77 1.77 0 1 1 2.5 2.5z',
	'M3 14.5h2.5l3 2h4.2a1.4 1.4 0 0 1 0 2.8H9.5',
	'M12.7 16.5l4.4-2.2a1.5 1.5 0 0 1 1.8 2.3L15 20.5H8.5l-2-1.3H3',
]);

/** Misi aktif */
export const IconSisupitSirine = createSisupitIcon('IconSisupitSirine', [
	'M7 18v-5a5 5 0 0 1 10 0v5',
	'M5 18h14v3H5z',
	'M12 2.5v2',
	'M4.6 5.6 6 7',
	'M19.4 5.6 18 7',
	'M2.5 12h2',
	'M19.5 12h2',
	'M10 13a2 2 0 0 1 2-2',
]);

/** Pohon tumbang */
export const IconSisupitPohon = createSisupitIcon('IconSisupitPohon', [
	'M2 21h20',
	'M3.5 21v-3.6l1.3.9 1-1.4 1.4 1.1V21',
	'M6.2 17.6l7.9-3.5',
	'M10.4 15.7l.9-2.1',
	'M15.4 15.6h3.9a2.6 2.6 0 0 0 .5-5.1 3.3 3.3 0 0 0-6.3-.5 2.8 2.8 0 0 0 1.9 5.6z',
]);

/** APAR */
export const IconSisupitApar = createSisupitIcon('IconSisupitApar', [
	'M10 8.5h4a3 3 0 0 1 3 3V19a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-7.5a3 3 0 0 1 3-3z',
	'M11 8.5v-3h2v3',
	'M9.5 5.5h6l1.5-1.5',
	'M11 6c-3.5 0-5 1.5-5 4.5V12',
	'M10 14h4',
]);

/** Siarkan misi */
export const IconSisupitSiaran = createSisupitIcon('IconSisupitSiaran', [
	'M10.5 10a1.5 1.5 0 1 0 3.0 0a1.5 1.5 0 1 0 -3.0 0',
	'M8.8 13.2a4.5 4.5 0 0 1 0-6.4',
	'M15.2 6.8a4.5 4.5 0 0 1 0 6.4',
	'M6 16a8.5 8.5 0 0 1 0-12',
	'M18 4a8.5 8.5 0 0 1 0 12',
	'M12 11.5V21',
	'M9.5 21h5',
]);
