import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { ArrowLeft, Calendar, ExternalLink, Mail, MapPin, Phone } from 'lucide-react';

export default function DialogRelawanDetail({ open, onClose, helper, onBack }) {
	const getMapsUrl = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			{/* PERBAIKAN: Menambahkan 'overflow-hidden' agar background anak elemen tidak bocor di sudut-sudutnya */}
			<DialogContent className="mb-[80px] flex max-h-[calc(100vh-120px)] w-[95vw] flex-col overflow-hidden rounded-xl border border-border bg-card p-0 shadow-sm outline-none sm:mb-0 sm:max-w-md">
				{/* HEADER */}
				<DialogHeader className="z-10 flex shrink-0 flex-row items-center gap-3 space-y-0 overflow-hidden border-b border-border bg-card px-4 py-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={onBack}
						className="h-8 w-8 rounded-lg transition-colors hover:bg-accent"
					>
						<ArrowLeft size={18} className="text-muted-foreground" />
					</Button>
					<DialogTitle className="text-base font-semibold text-foreground">Profil Relawan</DialogTitle>
				</DialogHeader>

				{/* KONTEN TENGAH */}
				<div className="flex-1 overflow-y-auto bg-muted p-5">
					{helper && (
						<>
							<div className="mb-6 flex flex-col items-center">
								<div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full border border-border bg-card text-3xl font-semibold text-foreground shadow-sm">
									{helper.user?.name?.[0]?.toUpperCase() ?? '?'}
								</div>
								<h3 className="text-center text-lg font-semibold text-foreground">
									{helper.user?.name}
								</h3>
								<span className="mt-2 rounded-md border border-info/20 bg-info/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-info">
									Relawan Terdaftar
								</span>
							</div>

							<div className="space-y-2.5">
								<DetailItem
									icon={<Phone />}
									label="Nomor Handphone"
									value={helper.user?.phone || 'Tidak dicantumkan'}
									href={helper.user?.phone ? `tel:${helper.user.phone}` : null}
									actionIcon={helper.user?.phone ? true : false}
								/>

								<DetailItem
									icon={<MapPin />}
									label="Posisi Relawan"
									value="Buka di Google Maps"
									href={getMapsUrl(helper.location_lat, helper.location_lng)}
									actionIcon={true}
								/>

								<DetailItem
									icon={<Mail />}
									label="Email"
									value={helper.user?.email}
									href={helper.user?.email ? `mailto:${helper.user.email}` : null}
								/>

								<DetailItem icon={<Calendar />} label="Waktu Respons" value={helper.created_at} />
							</div>
						</>
					)}
				</div>

				{/* FOOTER */}
				<div className="shrink-0 border-t border-border bg-card px-5 pb-4 pt-3">
					<Button
						className="h-10 w-full rounded-lg border border-border bg-transparent font-medium text-foreground transition-colors hover:bg-accent"
						variant="outline"
						onClick={onClose}
					>
						Tutup
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function DetailItem({ icon, label, value, href, actionIcon }) {
	if (!value) return null;

	const ContentWrapper = href ? 'a' : 'div';
	const linkProps = href
		? {
				href,
				target: href.startsWith('http') ? '_blank' : '_self',
				rel: href.startsWith('http') ? 'noopener noreferrer' : '',
			}
		: {};

	return (
		<ContentWrapper
			{...linkProps}
			className={`flex items-center gap-3 rounded-lg border border-border bg-card p-3.5 shadow-sm transition-colors ${
				href
					? 'group cursor-pointer outline-none hover:border-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-muted-foreground/50'
					: ''
			}`}
		>
			<div
				className={`mt-0.5 transition-colors [&>svg]:h-[16px] [&>svg]:w-[16px] ${href ? 'text-muted-foreground group-hover:scale-105' : 'text-muted-foreground/70'}`}
			>
				{icon}
			</div>
			<div className="min-w-0 flex-1">
				<p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
				<p
					className={`break-words text-[13px] font-medium leading-tight transition-colors ${href ? 'text-foreground' : 'text-muted-foreground'}`}
				>
					{value}
				</p>
			</div>

			{actionIcon && (
				<div className="shrink-0 text-muted-foreground/70 transition-colors group-hover:text-muted-foreground">
					<ExternalLink size={14} />
				</div>
			)}
		</ContentWrapper>
	);
}
