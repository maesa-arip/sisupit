import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export function flashMessage(params) {
	return params.props.flash_message;
}

// Opsi navigator.geolocation bersama. Default browser (timeout: Infinity, maximumAge: 0)
// membuat request bisa menggantung selamanya, dan maximumAge:0 melarang pakai fix terbaru
// sehingga selalu menunggu cold fix GPS. Preset di bawah memberi timeout tegas + mengizinkan
// reuse fix yang baru agar deteksi lebih cepat dan tidak sering gagal (terutama di WebView).
export const GEO_OPTIONS = {
	// Deteksi sekali (form lapor darurat, cari aset terdekat, lengkapi profil):
	// akurat, boleh pakai fix <= 30 dtk terakhir, beri 20 dtk untuk cold fix.
	oneShot: { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 },
	// Pelacakan live (watchPosition responder): tetap akurat & cukup segar, timeout longgar.
	tracking: { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
};

export const messages = {
	503: {
		title: 'Service Unavailable',
		description: 'Sorry, we are doing some maintenance. Please check back soon',
		status: '503,',
	},
	500: {
		title: 'Server Error',
		description: 'Oops, something when wrong on our servers',
		status: '500,',
	},
	404: {
		title: 'Not Found',
		description: 'Sorry, the page you are looking for could not be found',
		status: '404,',
	},
	403: {
		title: 'Forbidden',
		description: 'Sorry, you are forbidden from accessing this page',
		status: '403,',
	},
	401: {
		title: 'Unauthorized',
		description: 'Sorry, you are unauthorized to  access this page',
		status: '401,',
	},
	429: {
		title: 'Too Many Request',
		description: 'Please try again in just a second',
		status: '429,',
	},
};
