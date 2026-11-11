import StatusBadge from '@/Components/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import UserLeafletMap from '@/Components/UserLeafletMap';
import AppLayout from '@/Layouts/AppLayout';
import { reportIcon } from '@/lib/report-icon';
import { Head, Link } from '@inertiajs/react';
import { IconHome, IconInfoCircle, IconPhone } from '@tabler/icons-react';

// Detail TERBATAS "kejadian di sekitar Anda" untuk warga (TASK_89), tujuan ketuk notifikasi
// biasa sesudah verifikasi. Server hanya mengirim kolom di `incident` - tanpa identitas pelapor
// atau responder, tanpa foto, tanpa deskripsi. Jangan tambah data dari Reports/Show ke sini.
export default function IncidentShow({ incident, teleponDarurat, namaInstansi }) {
	const { Icon, className: iconClass } = reportIcon(incident);
	const telHref = teleponDarurat ? `tel:${teleponDarurat.replace(/[^0-9+]/g, '')}` : null;
	const reportedAt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(
		new Date(incident.created_at),
	);
	const isResolved = incident.status === 'resolved';
	const hasPoint = Number.isFinite(incident.lat) && Number.isFinite(incident.lng) && incident.lat && incident.lng;

	return (
		<>
			<Head title="Kejadian di Sekitar Anda" />

			<div className="mx-auto mt-4 flex w-full max-w-2xl flex-col space-y-6 pb-24 sm:pb-6">
				{!isResolved && (
					<div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
						<IconInfoCircle className="mt-0.5 h-6 w-6 shrink-0" />
						<div className="text-sm font-medium leading-relaxed">
							Jauhi lokasi kejadian dan beri jalan bagi kendaraan petugas. Jangan mendekat untuk menonton
							atau merekam.
						</div>
					</div>
				)}

				<Card className="overflow-hidden">
					<CardContent className="space-y-5 p-5 sm:p-6">
						<div className="flex items-start gap-3">
							<span
								className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconClass}`}
							>
								<Icon className="h-6 w-6" />
							</span>
							<div className="min-w-0 flex-1 space-y-1.5">
								<h1 className="text-lg font-semibold leading-snug text-foreground">{incident.title}</h1>
								<StatusBadge status={incident.status} />
							</div>
						</div>

						<dl className="divide-y divide-border/70 rounded-xl bg-muted/40 px-4">
							<div className="flex flex-col gap-1 py-3">
								<dt className="text-[15px] text-muted-foreground">Lokasi</dt>
								<dd className="text-[15px] font-semibold text-foreground">
									{incident.address || 'Lokasi tidak tercatat'}
								</dd>
							</div>
							<div className="flex items-center justify-between gap-4 py-3">
								<dt className="text-[15px] text-muted-foreground">Dilaporkan</dt>
								<dd className="text-right text-[15px] font-semibold text-foreground">{reportedAt}</dd>
							</div>
						</dl>

						{hasPoint && (
							<div className="h-56 overflow-hidden rounded-xl border border-border/70">
								<UserLeafletMap lat={incident.lat} lng={incident.lng} autoLocate={false} zoom={16} />
							</div>
						)}

						<div className="flex flex-col gap-3 sm:flex-row">
							{telHref && (
								<Button asChild className="flex-1">
									<a href={telHref}>
										<IconPhone className="h-5 w-5" />
										Hubungi {namaInstansi}
									</a>
								</Button>
							)}
							<Button asChild variant="outline" className="flex-1">
								<Link href={route('dashboard')}>
									<IconHome className="h-5 w-5" />
									Kembali ke Beranda
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);
}

IncidentShow.layout = (page) => <AppLayout children={page} title="Kejadian di Sekitar Anda" />;
