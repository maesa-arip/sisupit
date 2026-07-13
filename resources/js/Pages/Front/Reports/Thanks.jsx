import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { cn, reportNumber } from '@/lib/utils';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { IconArrowRight, IconShieldCheckFilled, IconPhoneCall, IconInfoCircle } from '@tabler/icons-react';
import { Fragment } from 'react';

// Alur pasca-lapor, memakai label status kanonik (lihat StatusBadge). Tahap aktif
// setelah submit selalu "Laporan Masuk" (status TERLAPOR).
const STEPS = ['Laporan Masuk', 'Terverifikasi', 'Penanganan', 'Selesai'];

export default function ReportThanks({ report, pejabat, teleponDarurat }) {
	const submittedAt = new Intl.DateTimeFormat('id-ID', {
		dateStyle: 'long',
		timeStyle: 'short',
	}).format(new Date(report.created_at));

	const telHref = teleponDarurat ? `tel:${teleponDarurat.replace(/[^0-9+]/g, '')}` : null;

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

						{/* Mini-stepper: alur status setelah lapor */}
						<div className="rounded-lg border border-border bg-card p-4">
							<p className="mb-3 text-xs font-medium text-muted-foreground">Tahap berikutnya</p>
							<ol className="flex items-start">
								{STEPS.map((step, i) => (
									<Fragment key={step}>
										<li className="flex flex-col items-center gap-1.5">
											<span
												className={cn(
													'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold',
													i === 0
														? 'bg-destructive text-destructive-foreground'
														: 'bg-muted text-muted-foreground',
												)}
											>
												{i + 1}
											</span>
											<span
												className={cn(
													'text-center text-[10px] font-medium leading-tight sm:text-[11px]',
													i === 0 ? 'text-destructive' : 'text-muted-foreground',
												)}
											>
												{step}
											</span>
										</li>
										{i < STEPS.length - 1 && <span className="mt-3 h-px flex-1 bg-border" />}
									</Fragment>
								))}
							</ol>
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

				{/* 3. Footer Otoritas & Kontrak (legitimasi instansi + pejabat, tanpa logo pariwisata) */}
				<div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 sm:flex-row sm:gap-5">
					{/* Kiri: Legitimasi Instansi */}
					<div className="flex items-center gap-3">
						<span className="flex h-12 w-12 shrink-0 items-center justify-center">
							<img
								src="/images/lambang-denpasar.png"
								alt="Lambang Kota Denpasar"
								loading="lazy"
								className="max-h-11 w-auto"
							/>
						</span>
						<span className="flex h-12 w-12 shrink-0 items-center justify-center">
							<img
								src="/images/damkar-mark.png"
								alt="Pemadam Kebakaran Kota Denpasar"
								loading="lazy"
								className="max-h-12 w-auto"
							/>
						</span>
						<div className="ml-1 flex flex-col justify-center">
							<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
								Layanan Resmi
							</span>
							<span className="whitespace-nowrap text-sm font-semibold text-foreground">
								Pemerintah Kota Denpasar
							</span>
						</div>
					</div>

					{/* Kanan: Otoritas Pejabat (sesuai kontrak). Foto potret kotak membulat, urut foto→nama. */}
					<div className="flex w-full items-center gap-3 border-t border-border pt-4 sm:w-auto sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
						<img
							src={pejabat.foto}
							alt={`Foto ${pejabat.nama}`}
							loading="lazy"
							className="h-28 w-24 shrink-0 rounded-lg object-cover object-top ring-1 ring-border"
						/>
						<div className="min-w-0 leading-tight">
							<p className="text-sm font-bold text-foreground">{pejabat.nama}</p>
							<p className="mt-0.5 text-xs leading-snug text-muted-foreground">{pejabat.jabatan}</p>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

ReportThanks.layout = (page) => <AppLayout children={page} title="Laporan Diterima" />;
