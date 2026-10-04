import { AppEmpty, AppGreeting, AppList, AppListRow, AppSection } from '@/Components/AppSection';
import StatusBadge from '@/Components/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/Components/ui/dialog';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import useRealtimeStatus from '@/hooks/use-realtime-status';
import useReportFeed from '@/hooks/use-report-feed';
import AppLayout from '@/Layouts/AppLayout';
import { cn, timeAgo } from '@/lib/utils';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
	IconAlertCircle,
	IconBuildingCommunity,
	IconCheck,
	IconHistory,
	IconMapPin,
	IconNavigation,
	IconPhone,
} from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Beranda akun OPD/instansi terkait - TASK_72 fase 4, dirancang ulang dari nol.
 *
 * Pertanyaan utamanya: "apakah instansi saya diminta membantu, dan perlu saya konfirmasi?". Satu-satunya
 * tindakan OPD - mengonfirmasi tindakan yang dijanjikan (mis. "listrik sudah dipadamkan") - kini bisa
 * dikerjakan LANGSUNG dari sini lewat endpoint yang sama dengan halaman detail
 * (`reports.agencies.confirm`): petugas di lokasi sedang menunggu kabar itu untuk boleh menyemprot air.
 * Daftar dipisah menurut keadaan: menunggu konfirmasi -> aktif -> riwayat.
 */

const ACTIVE = ['TERLAPOR', 'pending', 'handling'];

const REALTIME_META = {
	connected: { label: 'Realtime aktif', className: 'bg-success/10 text-success', dot: 'bg-success' },
	connecting: { label: 'Menyambung ulang...', className: 'bg-warning/10 text-warning', dot: 'bg-warning' },
	offline: { label: 'Realtime terputus', className: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
	disabled: { label: 'Realtime nonaktif', className: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
};

function directionsUrl(lat, lng) {
	return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function AwaitingCard({ item, onConfirm }) {
	return (
		<Card className="overflow-hidden rounded-2xl border-warning/40 bg-warning/[0.07] p-4 shadow-sm md:p-5">
			<div className="text-xs font-bold uppercase tracking-wide text-warning">
				Menunggu konfirmasi - diminta {timeAgo(item.notified_at || item.created_at)}
			</div>
			<h2 className="mt-1 text-[19px] font-bold leading-snug tracking-tight text-foreground">{item.title}</h2>
			<p className="mt-1 flex items-start gap-1.5 text-[13px] text-muted-foreground">
				<IconMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" stroke={2} />
				<span>{item.location}</span>
			</p>
			<p className="mt-3 rounded-xl bg-card px-3 py-2 text-[15px] font-semibold text-foreground">
				Diminta: {item.confirmation_label}
			</p>
			<div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
				<Button className="col-span-2 h-11 rounded-xl sm:col-span-1" onClick={() => onConfirm(item)}>
					<IconCheck className="mr-1.5 h-4 w-4" /> Konfirmasi sudah dilakukan
				</Button>
				{item.lat && item.lng && (
					<Button variant="outline" className="h-11 rounded-xl" asChild>
						<a href={directionsUrl(item.lat, item.lng)} target="_blank" rel="noreferrer">
							<IconNavigation className="mr-1.5 h-4 w-4" /> Arah
						</a>
					</Button>
				)}
				<Button variant="outline" className="h-11 rounded-xl" asChild>
					<Link href={route('reports.show', item.id)}>Detail</Link>
				</Button>
			</div>
		</Card>
	);
}

function RequestRow({ item }) {
	return (
		<AppListRow
			href={route('reports.show', item.id)}
			leading={
				<div className="shrink-0 rounded-xl bg-muted p-2 text-muted-foreground md:p-2.5">
					<IconBuildingCommunity className="h-5 w-5" stroke={2} />
				</div>
			}
			title={item.title}
			aside={item.time}
			meta={
				/* Lokasi tampil juga di ponsel: mitra yang dimintai bantuan perlu tahu KE MANA (#170). */
				<span className="flex min-w-0 items-start gap-1.5">
					<IconMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
					<span>{item.location}</span>
				</span>
			}
			badges={
				<>
					<StatusBadge status={item.status} />
					{item.requires_confirmation && item.confirmed_at && (
						<span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
							<IconCheck className="h-3.5 w-3.5" /> {item.confirmation_label}
						</span>
					)}
				</>
			}
		/>
	);
}

export default function OpdDashboard({ agencyName, requests = [], feed_channel = null }) {
	const { tenant } = usePage().props;
	const realtime = REALTIME_META[useRealtimeStatus()];
	const [toConfirm, setToConfirm] = useState(null);
	const [note, setNote] = useState('');
	const [processing, setProcessing] = useState(false);

	// Channel OPD bukan channel wilayah melainkan `reports.agency.{id}`: yang relevan bagi mitra luar
	// adalah insiden yang instansinya diminta membantu (lihat User::reportFeedChannel).
	useReportFeed(feed_channel, () => router.reload({ only: ['requests'] }));

	const isActive = (r) => ACTIVE.includes(r.status);
	const awaiting = requests.filter((r) => isActive(r) && r.requires_confirmation && !r.confirmed_at);
	const awaitingIds = new Set(awaiting.map((r) => r.id));
	const active = requests.filter((r) => isActive(r) && !awaitingIds.has(r.id));
	const history = requests.filter((r) => !isActive(r)).slice(0, 10);

	const submitConfirm = () => {
		if (!toConfirm) return;
		setProcessing(true);
		router.post(
			route('reports.agencies.confirm', toConfirm.id),
			{ agency_id: toConfirm.agency_id, note },
			{
				preserveScroll: true,
				onSuccess: () => {
					toast.success('Konfirmasi dicatat. Pusat Komando & petugas sudah diberi tahu.');
					setToConfirm(null);
					setNote('');
				},
				onError: () => toast.error('Gagal mencatat konfirmasi. Coba lagi dari halaman insiden.'),
				onFinish: () => setProcessing(false),
			},
		);
	};

	return (
		<div className="flex h-full w-full flex-col space-y-6 pb-32 lg:space-y-8">
			<Head title="Permintaan Bantuan" />

			<AppGreeting
				title={agencyName || 'Instansi Terkait'}
				meta={
					<>
						<span className="text-[13px] font-medium text-muted-foreground md:text-sm">
							Permintaan bantuan dari Pemadam Kebakaran
						</span>
						<span
							className={cn(
								'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
								realtime.className,
							)}
						>
							<span className={cn('h-1.5 w-1.5 rounded-full', realtime.dot)} />
							{realtime.label}
						</span>
					</>
				}
			/>

			{!agencyName && (
				<div className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/10 p-4 text-warning">
					<IconAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
					<p className="text-[15px] font-medium leading-relaxed">
						Akun Anda belum ditautkan ke instansi mana pun, jadi belum ada permintaan yang bisa ditampilkan.
						Hubungi admin Damkar wilayah Anda untuk menautkannya.
					</p>
				</div>
			)}

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
				<div className="space-y-6 lg:col-span-2 lg:space-y-8">
					{awaiting.length > 0 && (
						<AppSection title="Menunggu Konfirmasi Anda" count={awaiting.length}>
							<div className="space-y-3">
								{awaiting.map((item) => (
									<AwaitingCard key={item.id} item={item} onConfirm={setToConfirm} />
								))}
							</div>
						</AppSection>
					)}

					<AppSection title="Permintaan Aktif" count={active.length || undefined}>
						<AppList>
							{active.map((item) => (
								<RequestRow key={item.id} item={item} />
							))}
							{active.length === 0 && (
								<AppEmpty
									icon={IconCheck}
									title={awaiting.length ? 'Tidak ada permintaan lain' : 'Tidak ada permintaan aktif'}
									description="Instansi Anda sedang tidak dilibatkan di kejadian lain yang masih berjalan."
								/>
							)}
						</AppList>
					</AppSection>
				</div>

				<div className="space-y-6 lg:space-y-8">
					{tenant?.telepon_darurat && (
						<AppSection title="Pusat Komando">
							<div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
								<div className="min-w-0 flex-1">
									<div className="text-[15px] font-semibold text-foreground">
										{tenant.nama_instansi || 'Pemadam Kebakaran'}
									</div>
									<div className="mt-0.5 text-[13px] text-muted-foreground">
										Hubungi bila perlu koordinasi
									</div>
								</div>
								<Button variant="outline" className="h-10 rounded-xl" asChild>
									<a href={`tel:${tenant.telepon_darurat}`}>
										<IconPhone className="mr-1.5 h-4 w-4" /> {tenant.telepon_darurat}
									</a>
								</Button>
							</div>
						</AppSection>
					)}

					<AppSection
						title="Riwayat"
						icon={IconHistory}
						action={
							history.length ? { href: route('front.reports.index'), label: 'Lihat semua' } : undefined
						}
					>
						<AppList>
							{history.map((item) => (
								<RequestRow key={item.id} item={item} />
							))}
							{history.length === 0 && (
								<AppEmpty
									icon={IconHistory}
									title="Belum ada riwayat"
									description="Kejadian yang sudah selesai tampil di sini."
								/>
							)}
						</AppList>
					</AppSection>
				</div>
			</div>

			<Dialog open={Boolean(toConfirm)} onOpenChange={(open) => !open && !processing && setToConfirm(null)}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Konfirmasi tindakan</DialogTitle>
						<DialogDescription>
							{toConfirm?.confirmation_label} - {toConfirm?.title}. Pusat Komando dan petugas di lokasi
							akan langsung diberi tahu.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor="opd-confirm-note">Catatan (opsional)</Label>
						<Textarea
							id="opd-confirm-note"
							value={note}
							maxLength={500}
							onChange={(e) => setNote(e.target.value)}
							placeholder="Mis. gardu sudah dimatikan pukul 10.15"
						/>
					</div>
					<DialogFooter className="gap-2">
						<Button variant="outline" disabled={processing} onClick={() => setToConfirm(null)}>
							Batal
						</Button>
						<Button disabled={processing} onClick={submitConfirm}>
							Konfirmasi
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

OpdDashboard.layout = (page) => <AppLayout children={page} title="Permintaan Bantuan" />;
