import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import useReportFeed from '@/hooks/use-report-feed';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { IconAlertCircle, IconBuildingCommunity, IconCheck, IconChevronRight, IconMapPin } from '@tabler/icons-react';

/**
 * Beranda akun OPD/instansi terkait (TASK_27).
 *
 * Sengaja BUKAN salinan dashboard petugas: yang relevan bagi mitra eksternal hanya insiden
 * yang instansinya diminta membantu — bukan seluruh laporan wilayah. Tindakan yang tersedia
 * juga cuma satu (mengonfirmasi tindakan yang dijanjikan), dan itu dilakukan di halaman detail
 * insiden supaya konteks lokasinya ikut terbaca.
 */
export default function OpdDashboard({ agencyName, requests = [], feed_channel = null }) {
	const awaiting = requests.filter((r) => r.requires_confirmation && !r.confirmed_at);

	// Channel OPD bukan channel wilayah melainkan `reports.agency.{id}`: yang relevan bagi mitra
	// luar adalah insiden yang instansinya diminta membantu, bukan seluruh laporan wilayah —
	// akun OPD memang sengaja tanpa kode wilayah (lihat User::reportFeedChannel).
	useReportFeed(feed_channel, () => router.reload({ only: ['requests'] }));

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<Head title="Permintaan Bantuan" />

			<HeaderTitle
				title={agencyName || 'Instansi Terkait'}
				subtitle="Permintaan bantuan dari Pemadam Kebakaran untuk instansi Anda."
				icon={IconBuildingCommunity}
			/>

			{!agencyName && (
				<div className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/10 p-4 text-warning">
					<IconAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
					<p className="text-sm font-medium leading-relaxed">
						Akun Anda belum ditautkan ke instansi mana pun, jadi belum ada permintaan yang bisa
						ditampilkan. Hubungi admin Damkar wilayah Anda untuk menautkannya.
					</p>
				</div>
			)}

			{awaiting.length > 0 && (
				<div className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/10 p-4 text-warning">
					<IconAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
					<p className="text-sm font-medium leading-relaxed">
						{awaiting.length} insiden menunggu konfirmasi tindakan dari instansi Anda.
					</p>
				</div>
			)}

			<div className="flex flex-col gap-3">
				{requests.length > 0 ? (
					requests.map((item) => {
						const pending = item.requires_confirmation && !item.confirmed_at;

						return (
							<Card
								key={item.id}
								className={cn(
									'transition-colors',
									pending ? 'border-warning/40' : 'hover:border-primary/40',
								)}
							>
								<CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
									<div className="min-w-0 flex-1 space-y-1">
										<h3 className="truncate text-sm font-bold text-foreground">{item.title}</h3>
										<p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
											<IconMapPin className="h-3.5 w-3.5 shrink-0" /> {item.location}
										</p>
										<p className="text-[11px] text-muted-foreground">{item.time}</p>

										{item.requires_confirmation && (
											<p
												className={cn(
													'flex items-start gap-1.5 pt-1 text-[11px] font-medium',
													item.confirmed_at ? 'text-success' : 'text-warning',
												)}
											>
												{item.confirmed_at ? (
													<IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
												) : (
													<IconAlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
												)}
												{item.confirmation_label}
												{item.confirmed_at ? ' — sudah dikonfirmasi' : ' — belum dikonfirmasi'}
											</p>
										)}
									</div>

									<Button variant="outline" size="sm" asChild className="shrink-0">
										<Link href={route('reports.show', item.id)}>
											Buka Insiden <IconChevronRight className="ml-1 h-4 w-4" />
										</Link>
									</Button>
								</CardContent>
							</Card>
						);
					})
				) : (
					<div className="rounded-xl border border-dashed border-input p-10 text-center">
						<span className="text-sm text-muted-foreground">
							Belum ada permintaan bantuan untuk instansi Anda.
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
OpdDashboard.layout = (page) => <AppLayout children={page} title="Permintaan Bantuan" />;
