import { AppEmpty, AppGreeting, AppList, AppListRow, AppSection } from '@/Components/AppSection';
import useReportFeed from '@/hooks/use-report-feed';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { IconAlertCircle, IconBuildingCommunity, IconCheck, IconMapPin } from '@tabler/icons-react';

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
		<div className="flex h-full w-full flex-col space-y-5 md:space-y-6">
			<Head title="Permintaan Bantuan" />

			{/* AppGreeting, bukan HeaderTitle: keempat dashboard memakai kepala halaman yang
			    sama supaya rupanya tidak menyimpang per peran. HeaderTitle tetap hidup dan
			    dipakai halaman lain. */}
			<AppGreeting
				title={agencyName || 'Instansi Terkait'}
				meta={
					<span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground md:text-sm">
						<IconBuildingCommunity className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" />
						Permintaan bantuan dari Pemadam Kebakaran untuk instansi Anda.
					</span>
				}
			/>

			{!agencyName && (
				<div className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/10 p-4 text-warning">
					<IconAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
					<p className="text-sm font-medium leading-relaxed">
						Akun Anda belum ditautkan ke instansi mana pun, jadi belum ada permintaan yang bisa ditampilkan.
						Hubungi admin Damkar wilayah Anda untuk menautkannya.
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

			{/* SELURUH baris bisa diketuk, jadi tombol "Buka Insiden" tak lagi diperlukan -
			    tanda panah di ujung baris sudah menyatakan hal yang sama, dan sasaran
			    sentuhnya jauh lebih besar daripada sebuah tombol kecil di pojok. */}
			<AppSection title="Permintaan Masuk" icon={IconBuildingCommunity} count={requests.length}>
				<AppList>
					{requests.length > 0 ? (
						requests.map((item) => {
							const pending = item.requires_confirmation && !item.confirmed_at;

							return (
								<AppListRow
									key={item.id}
									href={route('reports.show', item.id)}
									leading={
										<div
											className={cn(
												'shrink-0 rounded-xl p-2 md:p-2.5',
												pending
													? 'bg-warning/10 text-warning'
													: 'bg-muted text-muted-foreground',
											)}
										>
											{pending ? (
												<IconAlertCircle className="h-5 w-5" stroke={2} />
											) : (
												<IconBuildingCommunity className="h-5 w-5" stroke={2} />
											)}
										</div>
									}
									title={item.title}
									meta={
										<>
											<span className="flex min-w-0 items-center gap-1.5">
												<IconMapPin className="h-3.5 w-3.5 shrink-0" />
												<span className="truncate">{item.location}</span>
											</span>
											<span className="text-muted-foreground/60">•</span>
											<span className="shrink-0">{item.time}</span>
											{item.requires_confirmation && (
												<span
													className={cn(
														'flex w-full items-start gap-1.5 font-medium',
														item.confirmed_at ? 'text-success' : 'text-warning',
													)}
												>
													{item.confirmed_at ? (
														<IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
													) : (
														<IconAlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
													)}
													{item.confirmation_label}
													{item.confirmed_at
														? ' - sudah dikonfirmasi'
														: ' - belum dikonfirmasi'}
												</span>
											)}
										</>
									}
								/>
							);
						})
					) : (
						<AppEmpty
							icon={IconBuildingCommunity}
							title="Belum ada permintaan"
							description="Belum ada permintaan bantuan untuk instansi Anda."
						/>
					)}
				</AppList>
			</AppSection>
		</div>
	);
}
OpdDashboard.layout = (page) => <AppLayout children={page} title="Permintaan Bantuan" />;
