import StatusBadge from '@/Components/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import { cn, NOMOR_DARURAT_NASIONAL, reportNumber } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { IconArrowRight, IconInfoCircle, IconPhoneCall, IconShieldCheckFilled } from '@tabler/icons-react';
import { Fragment, useEffect, useState } from 'react';

// Alur pasca-lapor, memakai label status kanonik (lihat StatusBadge). Kedua deret ini
// SEJAJAR: STEP_STATUS[i] adalah status yang membuat STEPS[i] jadi tahap berjalan.
//
// Halaman ini ber-ID dan bisa dibuka ulang kapan saja, jadi tahap berjalannya harus dibaca
// dari status laporan — dulu ia dipaku di indeks 0, sehingga laporan yang sudah ditangani
// atau selesai pun tetap berhenti di "Laporan Masuk".
const STEP_STATUS = ['TERLAPOR', 'pending', 'handling', 'resolved'];
const STEPS = ['Laporan Masuk', 'Terverifikasi', 'Penanganan', 'Selesai'];

// `ditolak` SENGAJA tidak punya tahap: ia bukan kemajuan di alur ini melainkan jalan buntu,
// jadi ditampilkan sebagai keterangan tersendiri, bukan sebagai langkah kelima.
const STATUS_DITOLAK = 'ditolak';

// Warna per tahap mengikuti kamus status kanonik (StatusBadge): Laporan Masuk merah,
// Terverifikasi kuning, Penanganan hijau, Selesai biru — jangan diseragamkan jadi satu warna,
// itu memutus hubungan visual dengan badge & peta.
const STEP_TONE = {
	TERLAPOR: { solid: 'bg-destructive text-destructive-foreground', tint: 'bg-destructive/15 text-destructive' },
	pending: { solid: 'bg-warning text-warning-foreground', tint: 'bg-warning/15 text-warning' },
	handling: { solid: 'bg-success text-success-foreground', tint: 'bg-success/15 text-success' },
	resolved: { solid: 'bg-info text-info-foreground', tint: 'bg-info/15 text-info' },
};

// Foto pejabat: path publik statis (/images/..) atau hasil upload di disk public (tenants/..).
const fotoUrl = (path) => (!path || path.startsWith('http') || path.startsWith('/') ? path : `/storage/${path}`);

export default function ReportThanks({ report, pejabat, namaInstansi, teleponDarurat, cityCode, isPartner }) {
	const submittedAt = new Intl.DateTimeFormat('id-ID', {
		dateStyle: 'long',
		timeStyle: 'short',
	}).format(new Date(report.created_at));

	const telHref = teleponDarurat ? `tel:${teleponDarurat.replace(/[^0-9+]/g, '')}` : null;

	const [status, setStatus] = useState(report.status || 'TERLAPOR');

	// Prop bisa berganti tanpa remount (mis. halaman dibuka ulang lewat navigasi Inertia).
	useEffect(() => setStatus(report.status || 'TERLAPOR'), [report.status]);

	// Pelapor tetap di halaman ini sambil menunggu; tanpa ini ia harus me-reload untuk tahu
	// laporannya sudah divalidasi atau sudah ada yang meluncur. Memakai channel & event yang
	// SUDAH ADA (report-tracking.{id} + ReportStatusChanged, lihat Reports/Show.jsx) — pelapor
	// memang sudah berhak di channel itu, jadi tak ada permukaan otorisasi baru.
	useEffect(() => {
		if (!window.Echo) return;

		const name = `report-tracking.${report.id}`;
		window.Echo.private(name).listen('ReportStatusChanged', (e) => setStatus(e.status));

		return () => window.Echo.leave(name);
	}, [report.id]);

	const isDitolak = status === STATUS_DITOLAK;
	const currentStep = STEP_STATUS.indexOf(status);

	return (
		<>
			<Head title="Laporan Diterima" />

			<div className="mx-auto mt-4 flex w-full max-w-2xl flex-col space-y-6 pb-24 sm:pb-6">
				{/* 1. Banner Instruksi Keselamatan (Prioritas Utama) */}
				<div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
					<IconInfoCircle className="mt-0.5 h-6 w-6 shrink-0" />
					<div className="text-sm font-medium leading-relaxed">
						Pastikan Anda berada di tempat yang aman dan jauhi titik bahaya. Jangan mencoba memadamkan api
						sendiri jika situasi sudah di luar kendali.
					</div>
				</div>

				{/* 2. Kartu Status Laporan & Aksi */}
				<Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
					<CardHeader className="border-b border-border bg-transparent pb-5">
						<div className="flex items-start gap-3">
							<IconShieldCheckFilled className="mt-0.5 h-8 w-8 shrink-0 text-success" />
							<div>
								<CardTitle className="text-xl font-bold tracking-tight text-foreground">Sinyal Darurat Diterima</CardTitle>
								<CardDescription className="mt-1.5 text-sm text-muted-foreground">
									Pusat Komando telah menerima laporan Anda. Petugas/relawan terdekat sedang
									dikoordinasikan untuk segera meluncur ke lokasi.
								</CardDescription>
							</div>
						</div>
					</CardHeader>

					<CardContent className="space-y-6 pt-6">
						<div className="space-y-2">
							<dl className="grid grid-cols-1 gap-4 rounded-lg bg-muted/50 p-4 sm:grid-cols-2">
								<div className="space-y-1">
									<dt className="text-xs font-medium text-muted-foreground">Nomor Laporan</dt>
									<dd className="font-mono text-sm font-bold tracking-tight text-foreground">{reportNumber(report)}</dd>
								</div>
								<div className="space-y-1">
									<dt className="text-xs font-medium text-muted-foreground">Waktu Kejadian</dt>
									<dd className="text-sm font-semibold text-foreground">{submittedAt}</dd>
								</div>
							</dl>
							<p className="text-xs text-muted-foreground">
								Sebutkan nomor laporan ini saat menelepon Damkar.
							</p>
						</div>

						{/* Mini-stepper: tahap yang SEDANG berlaku, bergerak sendiri lewat WebSocket. */}
						<div className="rounded-lg border border-border bg-card p-4">
							<div className="mb-3 flex items-center justify-between gap-2">
								<p className="text-xs font-medium text-muted-foreground">Status laporan</p>
								<StatusBadge status={status} />
							</div>

							{isDitolak ? (
								<p className="text-xs leading-relaxed text-muted-foreground">
									Laporan ini ditandai tidak dapat ditindaklanjuti oleh Pusat Komando. Bila keadaan
									daruratnya masih berlangsung, segera telepon Damkar.
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
															'text-center text-[10px] font-medium leading-tight sm:text-[11px]',
															isCurrent
																? 'font-bold text-foreground'
																: 'text-muted-foreground',
														)}
													>
														{step}
													</span>
												</li>
												{i < STEPS.length - 1 && (
													<span className="mt-3 h-px flex-1 bg-border" />
												)}
											</Fragment>
										);
									})}
								</ol>
							)}
						</div>

						<div className="space-y-2 pt-2">
							<div className="flex flex-col gap-3 sm:flex-row">
								<Button asChild className="h-12 flex-1 text-base font-medium">
									<Link href={route('reports.show', report.id)}>
										Pantau Bantuan
										<IconArrowRight className="ml-2 h-5 w-5" />
									</Link>
								</Button>

								{telHref && (
									<Button asChild variant="destructive" className="h-12 flex-1 text-base font-semibold">
										<a href={telHref}>
											<IconPhoneCall className="mr-2 h-5 w-5" />
											Telepon Damkar Sekarang
										</a>
									</Button>
								)}
							</div>
							{telHref && (
								<p className="text-center text-xs text-muted-foreground sm:text-left">
									Telepon jika api membesar atau ada korban.
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* 3. Footer Otoritas & Kontrak (legitimasi instansi + pejabat, tanpa logo pariwisata).
				    Instansi/pejabat berasal dari kota LAPORAN (tenant), bukan hardcode Denpasar. */}
				<div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 sm:flex-row sm:gap-5">
					{/* Kiri: Legitimasi Instansi */}
					<div className="flex items-center gap-3">
						{/* Lambang kota spesifik hanya untuk Denpasar (aset tersedia). Kota lain: mark Damkar generik. */}
						{cityCode === '5171' && (
							<span className="flex h-12 w-12 shrink-0 items-center justify-center">
								<img
									src="/images/lambang-denpasar.png"
									alt="Lambang Kota Denpasar"
									loading="lazy"
									className="max-h-11 w-auto"
								/>
							</span>
						)}
						<span className="flex h-12 w-12 shrink-0 items-center justify-center">
							<img
								src="/images/damkar-mark.png"
								alt="Pemadam Kebakaran"
								loading="lazy"
								className="max-h-12 w-auto"
							/>
						</span>
						<div className="ml-1 flex flex-col justify-center">
							<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
								Layanan Resmi
							</span>
							<span className="text-sm font-semibold text-foreground">{namaInstansi}</span>
						</div>
					</div>

					{/* Kanan: Otoritas Pejabat (dari tenant). Kabupaten non-partner: pesan 113, tanpa pejabat. */}
					{isPartner && pejabat ? (
						<div className="flex w-full items-center gap-3 border-t border-border pt-4 sm:w-auto sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
							{pejabat.foto && (
								<img
									src={fotoUrl(pejabat.foto)}
									alt={`Foto ${pejabat.nama}`}
									loading="lazy"
									className="h-28 w-24 shrink-0 rounded-lg object-cover object-top ring-1 ring-border"
								/>
							)}
							<div className="min-w-0 leading-tight">
								<p className="text-sm font-bold text-foreground">{pejabat.nama}</p>
								<p className="mt-0.5 text-xs leading-snug text-muted-foreground">{pejabat.jabatan}</p>
							</div>
						</div>
					) : (
						<div className="flex w-full items-start gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:w-auto sm:max-w-xs sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
							<IconInfoCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
							<span>
								Layanan langsung Damkar di wilayah ini belum aktif. Untuk darurat hubungi{' '}
								<span className="font-bold text-destructive">{NOMOR_DARURAT_NASIONAL}</span>.
							</span>
						</div>
					)}
				</div>
			</div>
		</>
	);
}

ReportThanks.layout = (page) => <AppLayout children={page} title="Laporan Diterima" />;
