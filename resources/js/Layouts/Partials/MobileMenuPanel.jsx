import { Drawer, DrawerContent, DrawerTitle } from '@/Components/ui/drawer';
import useSheetHistory from '@/hooks/use-sheet-history';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { IconChevronDown, IconChevronRight, IconSearch, IconX } from '@tabler/icons-react';
import { useMemo, useRef, useState } from 'react';
import { buildNavSections, buildQuickActions, flattenNavItems, resolveRoles } from './navItems';

// Di atas ambang ini panel menyediakan kolom cari. Admin/superadmin melewatinya jauh
// (14–20 tujuan) — merekalah yang tadinya harus men-scroll daftar 25 baris; warga & petugas
// tetap mendapat panel bersih tanpa kolom yang tak mereka butuhkan.
const SEARCH_THRESHOLD = 12;

// Titik henti drawer. Terbuka setengah layar lebih dulu (isi teratas cukup untuk identitas +
// aksi cepat, dan jempol tetap menjangkau semuanya), lalu bisa ditarik ke penuh.
const SNAP_POINTS = [0.62, 1];

/**
 * Panel "Menu" untuk layar <md.
 *
 * Menggantikan Sheet-dari-kanan berisi sidebar desktop apa adanya. Yang berubah bukan
 * daftar menunya (tetap satu, dari navItems.js) melainkan penyajiannya:
 *   - muncul dari BAWAH — searah dengan tombol pemicunya di bottom-nav & zona jempol
 *   - punya titik henti: setengah layar dulu, tarik untuk penuh
 *   - berkepala identitas pengguna, yang di mobile sebelumnya tak ada di mana pun
 *   - aksi cepat sebagai petak, bukan baris ke-sekian dalam daftar datar
 *   - seksi administrasi terlipat, legal turun ke kaki panel sebagai teks kecil
 *   - tombol Back perangkat menutup panel, bukan keluar halaman (lihat useSheetHistory)
 */
export default function MobileMenuPanel({ open, onOpenChange, auth, url }) {
	const tenant = usePage().props.tenant ?? null;
	const [snap, setSnap] = useState(SNAP_POINTS[0]);
	const [query, setQuery] = useState('');
	const searchRef = useRef(null);

	const releaseWithoutBack = useSheetHistory(open, () => onOpenChange(false), 'menu');

	const sections = useMemo(() => buildNavSections({ auth, url }), [auth, url]);
	const quickActions = useMemo(() => buildQuickActions(sections), [sections]);

	const navSections = sections.filter((s) => s.mobile === 'list' || s.mobile === 'collapsible');
	const legalSection = sections.find((s) => s.mobile === 'legal');
	const accountSection = sections.find((s) => s.mobile === 'account');

	const showSearch = flattenNavItems(navSections).length > SEARCH_THRESHOLD;
	const searchResults = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [];

		return flattenNavItems(sections).filter(
			(item) => item.title.toLowerCase().includes(q) || item.sectionTitle.toLowerCase().includes(q),
		);
	}, [query, sections]);

	// Menutup panel karena pindah halaman: jangan panen entri riwayat boneka, Inertia sedang
	// mendorong entri halaman barunya sendiri.
	const closeForNavigation = () => {
		releaseWithoutBack();
		onOpenChange(false);
	};

	const name = auth?.name || auth?.user?.name || null;
	const email = auth?.email || auth?.user?.email || null;
	const avatar = auth?.avatar || auth?.user?.avatar || null;
	const roles = resolveRoles(auth);

	return (
		<Drawer
			open={open}
			onOpenChange={(next) => {
				if (!next) setQuery('');
				onOpenChange(next);
			}}
			shouldScaleBackground={false}
			snapPoints={SNAP_POINTS}
			activeSnapPoint={snap}
			setActiveSnapPoint={setSnap}
		>
			<DrawerContent className="h-full max-h-[97%] gap-0 md:hidden">
				<DrawerTitle className="sr-only">Menu navigasi</DrawerTitle>

				{/* KEPALA — identitas + tombol tutup eksplisit. Grab handle saja tidak cukup
				    (NN/g): gesturnya ambigu dan tak terbaca pembaca layar. */}
				<div className="shrink-0 px-4 pb-3 pt-2">
					<div className="flex items-center gap-3">
						{name ? (
							<Link
								href={route('profile.edit')}
								onClick={closeForNavigation}
								className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-destructive"
							>
								<span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-base font-semibold text-muted-foreground">
									{avatar ? (
										<img src={avatar} alt="" className="h-full w-full object-cover" />
									) : (
										name.substring(0, 1).toUpperCase()
									)}
								</span>
								<span className="min-w-0 flex-1">
									<span className="block truncate text-sm font-bold text-foreground">{name}</span>
									<span className="mt-0.5 block truncate text-xs text-muted-foreground">
										{[roles.join(' · '), tenant?.nama_instansi].filter(Boolean).join(' — ') ||
											email}
									</span>
								</span>
								<IconChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
							</Link>
						) : (
							<div className="min-w-0 flex-1 p-1">
								<p className="text-sm font-bold text-foreground">Menu & Informasi</p>
								<p className="mt-0.5 text-xs text-muted-foreground">
									Masuk untuk melapor dan melihat riwayat.
								</p>
							</div>
						)}

						<button
							type="button"
							onClick={() => onOpenChange(false)}
							aria-label="Tutup menu"
							className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-destructive"
						>
							<IconX className="h-5 w-5" />
						</button>
					</div>

					{showSearch && (
						<div className="relative mt-3">
							<IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<input
								ref={searchRef}
								type="search"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								// Mengetik tanpa ruang baca adalah frustrasi klasik bottom sheet:
								// naikkan ke titik henti penuh begitu kolom disentuh.
								onFocus={() => setSnap(1)}
								placeholder="Cari menu…"
								aria-label="Cari menu"
								className="h-11 w-full rounded-xl border border-border bg-muted/40 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-destructive/40 focus:bg-background focus-visible:ring-2 focus-visible:ring-destructive/30"
							/>
						</div>
					)}
				</div>

				{/* BADAN — hanya bisa di-scroll saat panel penuh; di titik henti bawah, seretan
				    harus menggerakkan panel, bukan isinya. */}
				<div
					className={cn(
						'min-h-0 flex-1 px-4',
						snap === 1 ? 'overflow-y-auto overscroll-contain' : 'overflow-hidden',
					)}
				>
					{query.trim() ? (
						<SearchResults items={searchResults} onNavigate={closeForNavigation} />
					) : (
						<>
							{quickActions.length > 0 && (
								<div className="grid grid-cols-2 gap-2 pb-1">
									{quickActions.map((item) => (
										<QuickTile key={item.key} item={item} onNavigate={closeForNavigation} />
									))}
								</div>
							)}

							{navSections.map((section) =>
								section.mobile === 'collapsible' ? (
									<CollapsibleSection
										key={section.key}
										section={section}
										onNavigate={closeForNavigation}
									/>
								) : (
									<div key={section.key} className="pt-4">
										<SectionHeading>{section.title}</SectionHeading>
										<div className="mt-1 space-y-0.5">
											{section.items.map((item) => (
												<MenuRow key={item.key} item={item} onNavigate={closeForNavigation} />
											))}
										</div>
									</div>
								),
							)}

							{accountSection && (
								<div className="pt-4">
									<SectionHeading>{accountSection.title}</SectionHeading>
									<div className="mt-1 space-y-0.5">
										{accountSection.items.map((item) => (
											<MenuRow key={item.key} item={item} onNavigate={closeForNavigation} />
										))}
									</div>
								</div>
							)}
						</>
					)}
				</div>

				{/* KAKI — legal & bantuan sengaja diturunkan jadi teks kecil: wajib terjangkau
				    (syarat distribusi APK, FINDINGS #53) tapi tak layak berbobot sama dengan
				    "Lapor Darurat". Padding bawah menghormati poni/gesture bar perangkat. */}
				{legalSection && (
					<div
						className="shrink-0 border-t border-border px-4 pt-3"
						style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
					>
						<nav className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
							{legalSection.items.map((item) => (
								<Link
									key={item.key}
									href={item.url}
									onClick={closeForNavigation}
									className={cn(
										'text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-destructive',
										item.active
											? 'text-destructive'
											: 'text-muted-foreground hover:text-destructive',
									)}
								>
									{item.title}
								</Link>
							))}
						</nav>
					</div>
				)}
			</DrawerContent>
		</Drawer>
	);
}

function SectionHeading({ children }) {
	return <p className="px-1 text-[11px] font-black uppercase tracking-widest text-muted-foreground">{children}</p>;
}

/** Petak aksi cepat: tujuan tersering diberi target sentuh besar, bukan baris daftar. */
function QuickTile({ item, onNavigate }) {
	const Icon = item.icon;
	const danger = item.variant === 'danger';

	return (
		<Link
			href={item.url}
			onClick={onNavigate}
			className={cn(
				'flex min-h-[76px] flex-col justify-between rounded-2xl border p-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-destructive',
				danger
					? 'border-destructive/30 bg-destructive/10 text-destructive'
					: item.active
						? 'border-destructive/30 bg-destructive/5 text-destructive'
						: 'border-border bg-muted/40 text-foreground hover:bg-accent',
			)}
		>
			<Icon className="h-6 w-6 shrink-0" />
			<span className="mt-2 truncate text-sm font-semibold">{item.title}</span>
		</Link>
	);
}

/** Baris daftar setinggi ≥48dp dengan petak ikon + chevron — idiom daftar mobile. */
function MenuRow({ item, onNavigate }) {
	const Icon = item.icon;
	const danger = item.variant === 'danger';

	return (
		<Link
			href={item.url}
			onClick={onNavigate}
			{...(item.linkProps ?? {})}
			className={cn(
				'flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-destructive',
				item.active
					? 'bg-destructive text-destructive-foreground'
					: danger
						? 'text-destructive hover:bg-destructive/10'
						: 'text-foreground hover:bg-accent',
			)}
		>
			<span
				className={cn(
					'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
					item.active
						? 'bg-destructive-foreground/15'
						: danger
							? 'bg-destructive/10'
							: 'bg-muted text-muted-foreground',
				)}
			>
				<Icon className="h-5 w-5" />
			</span>
			<span className={cn('min-w-0 flex-1 truncate text-sm', item.active ? 'font-bold' : 'font-medium')}>
				{item.title}
			</span>
			{!item.linkProps && (
				<IconChevronRight
					className={cn(
						'h-4 w-4 shrink-0',
						item.active ? 'text-destructive-foreground/70' : 'text-muted-foreground/50',
					)}
				/>
			)}
		</Link>
	);
}

/**
 * Seksi terlipat untuk kelompok yang jarang disentuh (Administrasi/Kontrol Akses/Sistem).
 * Default tertutup — inilah yang memangkas panel superadmin dari 26 baris jadi ~11.
 * Terbuka otomatis kalau halaman yang sedang dibuka ada di dalamnya, supaya user tak
 * kehilangan jejak posisinya.
 */
function CollapsibleSection({ section, onNavigate }) {
	const [openSection, setOpenSection] = useState(() => section.items.some((item) => item.active));

	return (
		<div className="pt-4">
			<button
				type="button"
				onClick={() => setOpenSection((v) => !v)}
				aria-expanded={openSection}
				className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-destructive"
			>
				<span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
					{section.title}
				</span>
				<span className="rounded-full bg-muted px-1.5 text-[10px] font-bold text-muted-foreground">
					{section.items.length}
				</span>
				<IconChevronDown
					className={cn(
						'ml-auto h-4 w-4 text-muted-foreground transition-transform',
						openSection && 'rotate-180',
					)}
				/>
			</button>

			{openSection && (
				<div className="mt-1 space-y-0.5">
					{section.items.map((item) => (
						<MenuRow key={item.key} item={item} onNavigate={onNavigate} />
					))}
				</div>
			)}
		</div>
	);
}

function SearchResults({ items, onNavigate }) {
	if (items.length === 0) {
		return <p className="px-1 py-8 text-center text-sm text-muted-foreground">Menu tidak ditemukan.</p>;
	}

	return (
		<div className="space-y-0.5 pt-1">
			{items.map((item) => (
				<div key={item.key}>
					<p className="px-3 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
						{item.sectionTitle}
					</p>
					<MenuRow item={item} onNavigate={onNavigate} />
				</div>
			))}
		</div>
	);
}
