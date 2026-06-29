import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import {
	IconArrowLeft,
	IconBrandWhatsapp,
	IconCalendarEvent,
	IconMail,
	IconMapPinFilled,
	IconMedal,
	IconPhone,
	IconUser,
} from '@tabler/icons-react';

export default function Show({ volunteer }) {
	const user = volunteer;

	// Normalisasi nomor untuk tautan: 08xx -> 628xx, buang karakter non-digit.
	const digits = (user.phone || '').replace(/\D/g, '');
	const waNumber = digits.startsWith('0') ? '62' + digits.slice(1) : digits;
	const hasPhone = digits.length > 0;

	return (
		<div className="relative flex w-full flex-col space-y-6 pb-32">
			{/* Header & Tombol Kembali */}
			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle title="Profil Relawan" subtitle="Detail informasi dan kontak relawan." icon={IconUser} />
				<Button
					variant="outline"
					className="h-9 rounded-md border-border bg-card px-4 text-sm font-medium text-foreground/80 shadow-sm transition-colors hover:bg-muted"
					asChild
				>
					<Link href={route('front.volunteers.index')}>
						<IconArrowLeft className="mr-2 h-4 w-4" />
						Kembali
					</Link>
				</Button>
			</div>

			{/* Layout Utama (Grid) */}
			<div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
				{/* KOLOM KIRI: Kartu Profil Utama */}
				<div className="space-y-5 lg:col-span-1">
					<Card className="overflow-hidden rounded-xl border-border shadow-sm">
						{/* Banner Background */}
						<div className="relative h-24 border-b border-border bg-muted">
							{/* Status Badge */}
							<div className="absolute right-4 top-4">
								<span
									className={`rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
										user.status === 'Siaga'
											? 'border-green-200 bg-green-50 text-green-700 dark:border-success/30 dark:bg-success/10 dark:text-success'
											: 'border-red-200 bg-red-50 text-red-700 dark:border-warning/30 dark:bg-warning/10 dark:text-warning'
									}`}
								>
									{user.status}
								</span>
							</div>
						</div>

						<CardContent className="flex flex-col items-center px-5 pb-6 pt-0 text-center">
							{/* Avatar */}
							<div className="z-10 -mt-12 mb-3 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border-4 border-background bg-muted text-3xl font-bold text-muted-foreground shadow-sm">
								{user.avatar ? (
									<img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
								) : (
									user.name.substring(0, 1).toUpperCase()
								)}
							</div>

							<h2 className="mb-0.5 text-xl font-semibold text-foreground">{user.name}</h2>
							<p className="mb-5 text-sm text-muted-foreground">Relawan Sisupit</p>

							{/* Tombol Aksi Cepat */}
							<div className="flex w-full flex-col gap-2.5">
								<Button
									asChild
									disabled={!hasPhone}
									className="h-10 w-full rounded-md bg-green-600 font-medium text-white transition-colors hover:bg-green-700 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:bg-success dark:text-success-foreground dark:hover:bg-success/90"
								>
									<a
										href={hasPhone ? `https://wa.me/${waNumber}` : undefined}
										target="_blank"
										rel="noopener noreferrer"
										aria-disabled={!hasPhone}
									>
										<IconBrandWhatsapp className="mr-2 h-4 w-4" /> WhatsApp
									</a>
								</Button>
								<div className="flex gap-2.5">
									<Button
										asChild
										variant="outline"
										disabled={!hasPhone}
										className="h-10 flex-1 rounded-md border-border bg-muted hover:bg-muted/70 aria-disabled:pointer-events-none aria-disabled:opacity-50"
									>
										<a href={hasPhone ? `tel:${digits}` : undefined} aria-disabled={!hasPhone}>
											<IconPhone className="h-4 w-4 text-muted-foreground" />
										</a>
									</Button>
									<Button
										asChild
										variant="outline"
										disabled={!user.email}
										className="h-10 flex-1 rounded-md border-border bg-muted hover:bg-muted/70 aria-disabled:pointer-events-none aria-disabled:opacity-50"
									>
										<a
											href={user.email ? `mailto:${user.email}` : undefined}
											aria-disabled={!user.email}
										>
											<IconMail className="h-4 w-4 text-muted-foreground" />
										</a>
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Kartu Statistik Mini */}
					<Card className="rounded-xl border-border shadow-sm">
						<CardContent className="flex items-center justify-between p-5">
							<div>
								<p className="text-[13px] font-medium text-muted-foreground">Total Bantuan</p>
								<p className="mt-0.5 text-2xl font-bold text-foreground">
									{user.reports_handled}{' '}
									<span className="text-sm font-normal text-muted-foreground/70">Kasus</span>
								</p>
							</div>
							<div className="flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
								<IconMedal className="h-5 w-5" stroke={1.5} />
							</div>
						</CardContent>
					</Card>
				</div>

				{/* KOLOM KANAN: Informasi Detail */}
				<div className="space-y-5 lg:col-span-2">
					<Card className="overflow-hidden rounded-xl border-border shadow-sm">
						<CardHeader className="border-b border-border bg-muted/50 pb-4">
							<CardTitle className="text-base font-semibold text-foreground">Informasi Pribadi</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<ul className="divide-y divide-border">
								<li className="flex items-start gap-4 p-5 transition-colors hover:bg-muted/50">
									<div className="rounded-md bg-destructive/10 p-2 text-destructive">
										<IconMapPinFilled className="h-4 w-4" />
									</div>
									<div>
										<p className="text-sm font-semibold text-foreground">Area Wilayah</p>
										<p className="mt-0.5 text-sm text-muted-foreground">
											{user.desa}, {user.kecamatan}, {user.kabupaten}
										</p>
										<p className="mt-1 text-xs text-muted-foreground/70">{user.address}</p>
									</div>
								</li>

								<li className="flex items-center gap-4 p-5 transition-colors hover:bg-muted/50">
									<div className="rounded-md bg-destructive/10 p-2 text-destructive">
										<IconPhone className="h-4 w-4" />
									</div>
									<div>
										<p className="text-sm font-semibold text-foreground">Nomor Telepon</p>
										<p className="mt-0.5 text-sm text-muted-foreground">
											{user.phone || 'Tidak ada nomor telepon'}
										</p>
									</div>
								</li>

								<li className="flex items-center gap-4 p-5 transition-colors hover:bg-muted/50">
									<div className="rounded-md bg-destructive/10 p-2 text-destructive">
										<IconMail className="h-4 w-4" />
									</div>
									<div>
										<p className="text-sm font-semibold text-foreground">Alamat Email</p>
										<p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>
									</div>
								</li>

								<li className="flex items-center gap-4 p-5 transition-colors hover:bg-muted/50">
									<div className="rounded-md bg-destructive/10 p-2 text-destructive">
										<IconCalendarEvent className="h-4 w-4" />
									</div>
									<div>
										<p className="text-sm font-semibold text-foreground">Bergabung Sejak</p>
										<p className="mt-0.5 text-sm text-muted-foreground">{user.join_date}</p>
									</div>
								</li>
							</ul>
						</CardContent>
					</Card>

					{/* Kartu Keahlian */}
					<Card className="overflow-hidden rounded-xl border-border shadow-sm">
						<CardHeader className="border-b border-border bg-muted/50 pb-4">
							<CardTitle className="text-base font-semibold text-foreground">
								Keahlian & Kemampuan
							</CardTitle>
						</CardHeader>
						<CardContent className="p-5">
							<div className="flex flex-wrap gap-2">
								{user.skills && user.skills.length > 0 ? (
									user.skills.map((skill, index) => (
										<span
											key={index}
											className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-3 py-1.5 text-[13px] font-medium text-foreground/80"
										>
											<IconMedal className="h-4 w-4 text-destructive" stroke={1.5} />
											{skill}
										</span>
									))
								) : (
									<p className="text-sm text-muted-foreground">Belum ada data keahlian.</p>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

Show.layout = (page) => <AppLayout children={page} title="Profil Relawan" />;
