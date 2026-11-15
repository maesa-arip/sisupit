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

	return (
		<div
			role={call.phase === 'incoming' ? 'alertdialog' : 'status'}
			aria-live="assertive"
			className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[70] mx-auto max-w-sm md:left-auto md:right-6 md:mx-0"
		>
			<div className="material-thick rounded-2xl border border-border/70 p-4 shadow-lg">
				<div className="flex items-start gap-3">
					<span
						className={cn(
							'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
							call.phase === 'ended' || call.phase === 'nomic'
								? 'bg-muted text-muted-foreground'
								: 'bg-success/15 text-success',
							ringing && 'motion-safe:animate-pulse',
						)}
					>
						{call.phase === 'ended' ? <IconPhoneOff className="h-5 w-5" /> : <IconPhoneCall className="h-5 w-5" />}
					</span>
					<div className="min-w-0 flex-1">
						<p className="text-[15px] font-semibold leading-snug text-foreground">{title}</p>
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
					{(call.phase === 'ended' || call.phase === 'nomic') && (
						<button
							type="button"
							onClick={dismissCall}
							aria-label="Tutup"
							className="-mr-1 -mt-1 rounded-full p-1.5 text-muted-foreground active:bg-accent"
						>
							<IconX className="h-4 w-4" />
						</button>
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
