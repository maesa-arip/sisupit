import StatusBadge from '@/Components/StatusBadge';
import { cn } from '@/lib/utils';
import { Fragment } from 'react';

// Kemajuan laporan dari sudut PELAPOR - dipakai halaman Thanks, kartu "Perkembangan Laporan
// Anda" di detail laporan, dan kartu laporan aktif di Beranda warga (#165). Dulu hanya hidup
// di Thanks, padahal halaman itu cuma dicapai sekali (redirect sesudah kirim): semua jalan
// masuk lain - Riwayat, Beranda, push notif, "Pantau Bantuan" - menuju detail, jadi status yang
// paling dibutuhkan pelapor hilang begitu ia pindah halaman. Satu komponen, tiga tempat.

// Alur pasca-lapor, memakai label status kanonik (lihat StatusBadge). Kedua deret ini
// SEJAJAR: STEP_STATUS[i] adalah status yang membuat STEPS[i] jadi tahap berjalan.
//
// Tahap berjalan dibaca dari status laporan - dulu ia dipaku di indeks 0, sehingga laporan
// yang sudah ditangani atau selesai pun tetap berhenti di "Laporan Masuk".
const STEP_STATUS = ['TERLAPOR', 'pending', 'handling', 'resolved'];
const STEPS = ['Laporan Masuk', 'Terverifikasi', 'Penanganan', 'Selesai'];

// `ditolak` SENGAJA tidak punya tahap: ia bukan kemajuan di alur ini melainkan jalan buntu,
// jadi ditampilkan sebagai keterangan tersendiri, bukan sebagai langkah kelima.
export const STATUS_DITOLAK = 'ditolak';

// `digabung` (TASK_55) juga bukan tahap: laporannya digabung ke laporan warga lain atas
// kejadian yang sama. Kalimatnya menegaskan laporannya DITERIMA - pelapor jujur yang hanya
// membaca "digabung" bisa mengira laporannya dianggap salah.
export const STATUS_DIGABUNG = 'digabung';

// Laporan yang tak lagi bergerak: tak ada regu yang perlu disebut "sedang menuju".
export const isClosedStatus = (status) => ['resolved', STATUS_DITOLAK, STATUS_DIGABUNG].includes(status);

// Warna per tahap mengikuti kamus status kanonik (StatusBadge): Laporan Masuk merah,
// Terverifikasi kuning, Penanganan hijau, Selesai biru — jangan diseragamkan jadi satu warna,
// itu memutus hubungan visual dengan badge & peta.
const STEP_TONE = {
	TERLAPOR: { solid: 'bg-destructive text-destructive-foreground', tint: 'bg-destructive/15 text-destructive' },
	pending: { solid: 'bg-warning text-warning-foreground', tint: 'bg-warning/15 text-warning' },
	handling: { solid: 'bg-success text-success-foreground', tint: 'bg-success/15 text-success' },
	resolved: { solid: 'bg-info text-info-foreground', tint: 'bg-info/15 text-info' },
};

// "Regu Garuda, Regu Elang dan 2 relawan" dari satu tahap ringkasan responder
// (ReportController::thanksResponders).
export const describeUnits = (stage) => {
	if (!stage) return '';
	const parts = [...stage.regus];
	if (stage.petugas > 0) parts.push(`${stage.petugas} petugas`);
	if (stage.relawan > 0) parts.push(`${stage.relawan} relawan`);
	return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} dan ${parts[parts.length - 1]}` : parts[0] || '';
};

/**
 * Kotak "Status laporan": badge + mini-stepper 4 tahap, atau keterangan untuk ditolak/digabung.
 */
export function ReportStepper({ status, className }) {
	const currentStep = STEP_STATUS.indexOf(status);

	return (
		<div className={cn('rounded-xl bg-muted/40 p-4', className)}>
			<div className="mb-3 flex items-center justify-between gap-2">
				<p className="text-[13px] font-medium text-muted-foreground">Status laporan</p>
				<StatusBadge status={status} />
			</div>

			{status === STATUS_DITOLAK ? (
				<p className="text-xs leading-relaxed text-muted-foreground">
					Laporan ini ditandai tidak dapat ditindaklanjuti oleh Pusat Komando. Bila keadaan daruratnya masih
					berlangsung, segera telepon Damkar.
				</p>
			) : status === STATUS_DIGABUNG ? (
				<p className="text-xs leading-relaxed text-muted-foreground">
					Kejadian ini sudah dilaporkan warga lain dan sedang diproses Pusat Komando. Laporan Anda digabungkan
					dengannya, dan perkembangannya tetap dikabarkan ke Anda.
				</p>
			) : (
				<ol className="flex items-start">
					{STEPS.map((step, i) => {
						const tone = STEP_TONE[STEP_STATUS[i]];
						const isCurrent = i === currentStep;
						const isDone = i < currentStep;

						return (
							<Fragment key={step}>
								<li className="flex flex-col items-center gap-1.5">
									<span
										className={cn(
											'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold',
											isCurrent && tone.solid,
											isDone && tone.tint,
											!isCurrent && !isDone && 'bg-muted text-muted-foreground',
										)}
									>
										{i + 1}
									</span>
									<span
										className={cn(
											'text-center text-[11px] font-medium leading-tight sm:text-[11px]',
											isCurrent ? 'font-bold text-foreground' : 'text-muted-foreground',
										)}
									>
										{step}
									</span>
								</li>
								{i < STEPS.length - 1 && <span className="mt-3 h-px flex-1 bg-border" />}
							</Fragment>
						);
					})}
				</ol>
			)}
		</div>
	);
}

/**
 * "Regu Garuda sudah tiba di lokasi. 2 relawan sedang menuju lokasi." - kosong (null) bila
 * belum ada yang bergerak atau laporannya sudah ditutup.
 */
export function ResponderSummary({ status, responders, className }) {
	if (isClosedStatus(status)) return null;

	const arrivedUnits = describeUnits(responders?.arrived);
	const enRouteUnits = describeUnits(responders?.en_route);
	if (!arrivedUnits && !enRouteUnits) return null;

	return (
		<p className={cn('text-[15px] leading-relaxed text-foreground', className)}>
			{arrivedUnits && (
				<>
					<span className="font-semibold">{arrivedUnits}</span> sudah tiba di lokasi.{' '}
				</>
			)}
			{enRouteUnits && (
				<>
					<span className="font-semibold">{enRouteUnits}</span> sedang menuju lokasi.
				</>
			)}
		</p>
	);
}
