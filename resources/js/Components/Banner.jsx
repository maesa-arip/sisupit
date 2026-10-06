import { Link } from '@inertiajs/react';
import { IconChevronRight, IconSpeakerphone, IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

// Pengumuman Sistem (#184). Dulu pita `fixed bottom-0` tanpa z-index: di ponsel tertutup
// MobileBottomNav (z-50) sehingga tak pernah terbaca, di desktop melayang menutupi isi tanpa
// bisa ditutup. Kini kartu biasa di alur halaman (pola NotificationDeviceBanner) - JANGAN
// kembalikan ke fixed/sticky: header AppLayout satu-satunya pita lengket (DashboardMobileShellTest).
// "Tutup" diingat PER pengumuman (id + isi), jadi pengumuman baru/yang diubah muncul lagi.
const STORAGE_KEY = 'sisupit:announcement-dismissed';

function dismissKey(announcement) {
	return `${announcement.id}:${announcement.updated_at ?? ''}`;
}

export default function Banner({ announcement }) {
	const key = dismissKey(announcement);
	// Mulai tersembunyi sampai localStorage dibaca, supaya kartu yang sudah ditutup tak berkedip.
	const [dismissed, setDismissed] = useState(true);

	useEffect(() => {
		try {
			setDismissed(window.localStorage.getItem(STORAGE_KEY) === key);
		} catch {
			setDismissed(false);
		}
	}, [key]);

	if (dismissed) return null;

	const close = () => {
		setDismissed(true);
		try {
			window.localStorage.setItem(STORAGE_KEY, key);
		} catch {
			// Penyimpanan diblokir: cukup tersembunyi sampai halaman dimuat ulang.
		}
	};

	const url = announcement.url || null;
	// URL wajib absolut (AnnouncementRequest `url`); alamat di luar situs ini dibuka lewat <a>, bukan
	// kunjungan Inertia (yang akan gagal CORS). Bila ada URL, SELURUH isi kartu jadi tautan (#185) - dulu
	// hanya teks kecil "Selengkapnya" yang bisa diketuk, mengetuk pesannya tak terjadi apa-apa.
	const isInternal = url && url.startsWith(window.location.origin);
	const body = (
		<>
			<span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
				<IconSpeakerphone className="h-4 w-4" stroke={2} />
			</span>
			<span className="block min-w-0 flex-1">
				<span className="block text-[11px] font-semibold uppercase tracking-wide text-primary">Pengumuman</span>
				<span className="mt-0.5 block whitespace-pre-line break-words text-sm leading-snug text-foreground">
					{announcement.message}
				</span>
				{url && (
					<span className="mt-1.5 inline-flex items-center gap-0.5 text-sm font-semibold text-primary">
						Selengkapnya
						<IconChevronRight className="h-4 w-4" stroke={2} />
					</span>
				)}
			</span>
		</>
	);
	const bodyClass = 'flex min-w-0 flex-1 items-start gap-3 rounded-lg';
	const linkClass = `${bodyClass} transition-opacity active:opacity-70`;

	return (
		<div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
			{!url ? (
				<div className={bodyClass}>{body}</div>
			) : isInternal ? (
				<Link href={url} className={linkClass}>
					{body}
				</Link>
			) : (
				<a href={url} target="_blank" rel="noopener noreferrer" className={linkClass}>
					{body}
				</a>
			)}
			<button
				type="button"
				onClick={close}
				aria-label="Tutup pengumuman"
				className="-mr-1.5 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground active:bg-primary/15"
			>
				<IconX className="h-4 w-4" stroke={2} />
			</button>
		</div>
	);
}
