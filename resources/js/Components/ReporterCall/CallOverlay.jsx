import { Button } from '@/Components/ui/button';
import { acceptCall, declineCall, dismissCall, hangUp, toggleMute, useReporterCall } from '@/lib/reporter-call';
import { cn } from '@/lib/utils';
import { IconMicrophone, IconMicrophoneOff, IconPhone, IconPhoneCall, IconPhoneOff, IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

/**
 * Layar panggilan Sisupit (TASK_90) - satu komponen untuk PEMANGGIL (Pusat Komando) dan PELAPOR.
 * Dipasang sekali di AppLayout; keadaannya dari lib/reporter-call.js (tingkat modul), jadi kartu ini
 * muncul lagi apa adanya sesudah pindah halaman. Kartu melayang di ATAS (bukan bawah) supaya tak
 * berebut tempat dengan bilah bawah & keyboard (#187) dan halaman di bawahnya tetap bisa dipakai.
 */
function formatDuration(ms) {
	const total = Math.max(0, Math.floor(ms / 1000));
	const m = String(Math.floor(total / 60)).padStart(2, '0');
	const s = String(total % 60).padStart(2, '0');
	return `${m}:${s}`;
}

export default function CallOverlay() {
	const call = useReporterCall();
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (call.phase !== 'connected') return undefined;
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, [call.phase]);

	if (call.phase === 'idle') return null;

	const isCaller = call.call?.side === 'caller';
	const callbackPhone = call.call?.callback_phone;

	let title;
	let subtitle;
	if (call.phase === 'incoming') {
		title = call.call?.caller_label || 'Pusat Komando Damkar';
		subtitle = `Panggilan suara tentang laporan ${call.call?.report_number || 'Anda'}`;
	} else if (call.phase === 'outgoing') {
		title = 'Memanggil pelapor...';
		subtitle = 'Berdering bila pelapor sedang membuka Sisupit atau halaman status laporannya.';
	} else if (call.phase === 'connecting') {
		title = 'Menyambungkan...';
		subtitle = isCaller ? 'Pelapor sudah menjawab.' : 'Tunggu sebentar.';
	} else if (call.phase === 'connected') {
		title = isCaller ? 'Tersambung dengan pelapor' : call.call?.caller_label || 'Pusat Komando Damkar';
		subtitle = formatDuration(now - (call.connectedAt || now));
	} else if (call.phase === 'nomic') {
		title = 'Mikrofon tidak bisa dipakai';
		subtitle = callbackPhone
			? `Aplikasi ini belum bisa memakai mikrofon. Telepon balik Damkar di ${callbackPhone}.`
			: 'Aplikasi ini belum bisa memakai mikrofon. Telepon balik Damkar.';
	} else {
		title = call.endLabel || 'Panggilan berakhir';
		subtitle = null;
	}

	const ringing = call.phase === 'incoming' || call.phase === 'outgoing';
	const ended = call.phase === 'ended' || call.phase === 'nomic';
	const showCityEmblem = call.call?.city_code === '5171';

	return (
		<div
			role={call.phase === 'incoming' ? 'alertdialog' : 'status'}
			aria-live="assertive"
			className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[70] mx-auto max-w-sm md:left-auto md:right-6 md:mx-0"
		>
			<div className="material-thick relative rounded-2xl border border-border/70 p-4 pt-5 shadow-lg">
				{ended && (
					<button
						type="button"
						onClick={dismissCall}
						aria-label="Tutup"
						className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground active:bg-accent"
					>
						<IconX className="h-4 w-4" />
					</button>
				)}

				<div className="flex flex-col items-center text-center">
					{/* Identitas penelepon (2026-11-19, permintaan user): lambang Kota Denpasar (hanya laporan
					    Denpasar - aset yang ada, sama dengan halaman Thanks) berdampingan dengan lambang Damkar.
					    Latar putih disengaja: kedua lambang dirancang di atas putih (pita hitam tak terbaca di gelap). */}
					<div className="relative">
						{ringing && (
							<span
								aria-hidden="true"
								className="absolute -inset-1.5 rounded-full bg-success/25 motion-safe:animate-ping"
							/>
						)}
						<div
							className={cn(
								'relative flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-border',
								ended && 'opacity-60 grayscale',
							)}
						>
							{showCityEmblem && (
								<img
									src="/images/lambang-denpasar.png"
									alt="Lambang Kota Denpasar"
									className="h-11 w-auto"
								/>
							)}
							<img src="/images/damkar-mark.png" alt="Pemadam Kebakaran" className="h-12 w-auto" />
						</div>
						<span
							className={cn(
								'absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-background',
								ended ? 'bg-muted-foreground text-background' : 'bg-success text-success-foreground',
							)}
						>
							{call.phase === 'ended' ? (
								<IconPhoneOff className="h-3.5 w-3.5" />
							) : (
								<IconPhoneCall className="h-3.5 w-3.5" />
							)}
						</span>
					</div>

					<p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
						Telepon via Sisupit
					</p>
					<p className="mt-0.5 text-[15px] font-semibold leading-snug text-foreground">{title}</p>
					{subtitle && (
						<p
							className={cn(
								'mt-0.5 text-[13px] leading-snug text-muted-foreground',
								call.phase === 'connected' && 'font-mono tabular-nums',
							)}
						>
							{subtitle}
						</p>
					)}
				</div>

				{call.phase === 'incoming' && (
					<div className="mt-4 grid grid-cols-2 gap-2">
						<Button variant="outline" className="h-11 rounded-xl" onClick={declineCall}>
							<IconPhoneOff className="mr-1.5 h-4 w-4" /> Tolak
						</Button>
						<Button
							className="h-11 rounded-xl bg-success text-success-foreground hover:bg-success/90"
							onClick={acceptCall}
						>
							<IconPhone className="mr-1.5 h-4 w-4" /> Terima
						</Button>
					</div>
				)}

				{['outgoing', 'connecting', 'connected'].includes(call.phase) && (
					<div className="mt-4 flex gap-2">
						{call.phase === 'connected' && (
							<Button variant="outline" className="h-11 flex-1 rounded-xl" onClick={toggleMute}>
								{call.muted ? (
									<>
										<IconMicrophoneOff className="mr-1.5 h-4 w-4" /> Nyalakan Suara
									</>
								) : (
									<>
										<IconMicrophone className="mr-1.5 h-4 w-4" /> Bisukan
									</>
								)}
							</Button>
						)}
						<Button variant="destructive" className="h-11 flex-1 rounded-xl" onClick={() => hangUp()}>
							<IconPhoneOff className="mr-1.5 h-4 w-4" />
							{call.phase === 'outgoing' ? 'Batalkan' : 'Akhiri'}
						</Button>
					</div>
				)}

				{call.phase === 'nomic' && callbackPhone && (
					<Button asChild variant="destructive" className="mt-4 h-11 w-full rounded-xl">
						<a href={`tel:${callbackPhone.replace(/[^0-9+]/g, '')}`}>
							<IconPhoneCall className="mr-1.5 h-4 w-4" /> Telepon Balik Damkar
						</a>
					</Button>
				)}
			</div>
		</div>
	);
}
