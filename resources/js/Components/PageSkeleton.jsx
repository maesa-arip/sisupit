import { Skeleton } from '@/Components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Kerangka halaman tujuan selama navigasi berjalan (TASK_70) - dipasang AppLayout, bukan
 * per halaman, jadi bentuknya ditebak dari PATH tujuan. Ukurannya meniru primitif aslinya
 * (HeaderTitle 26px/3xl, AppList rounded-2xl, baris AppListRow 64px) supaya saat data tiba
 * isinya tidak melompat.
 *
 * Warna `bg-muted-foreground/15`, bukan bawaan `ui/skeleton` (bg-primary/10): sejak --primary =
 * merah brand (PENGECUALIAN #4) bawaan itu membuat layar memuat tampak seperti peringatan.
 * `bg-muted` polos nyaris tak terlihat di atas latar halaman (foto 390px, 2026-10-04).
 */
export function skeletonVariant(url) {
	const path = new URL(url, 'http://x').pathname.replace(/\/+$/, '') || '/';

	if (path === '/dashboard' || path.endsWith('/dashboard')) return 'dashboard';
	if (path.startsWith('/peta-pemantauan')) return 'map';
	if (/\/(create|edit)$/.test(path) || path === '/profile' || path.includes('/settings')) return 'form';
	if (/\/(\d+|[0-9a-f-]{20,})$/i.test(path)) return 'detail';
	return 'list';
}

function Bar({ className }) {
	return <Skeleton className={cn('bg-muted-foreground/15 motion-reduce:animate-none', className)} />;
}

function Title() {
	return (
		<div className="space-y-2.5">
			<Bar className="h-8 w-2/3 max-w-xs rounded-lg lg:h-9" />
			<Bar className="h-4 w-full max-w-md" />
		</div>
	);
}

function Rows({ count }) {
	return (
		<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
			{Array.from({ length: count }, (_, i) => (
				<div key={i} className="flex min-h-[64px] items-center gap-3 px-4 py-3.5 md:px-5">
					<Bar className="size-10 shrink-0 rounded-xl" />
					<div className="flex-1 space-y-2">
						<Bar className="h-4 w-3/5" />
						<Bar className="h-3 w-2/5" />
					</div>
				</div>
			))}
		</div>
	);
}

const VARIANTS = {
	dashboard: () => (
		<>
			<Title />
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
				{Array.from({ length: 4 }, (_, i) => (
					<Bar key={i} className="h-24 rounded-2xl" />
				))}
			</div>
			<Bar className="h-3.5 w-32" />
			<Rows count={4} />
		</>
	),
	map: () => (
		<>
			<Title />
			<Bar className="h-[60dvh] rounded-2xl" />
		</>
	),
	form: () => (
		<>
			<Title />
			<div className="max-w-2xl space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:p-6">
				{Array.from({ length: 4 }, (_, i) => (
					<div key={i} className="space-y-2">
						<Bar className="h-3.5 w-24" />
						<Bar className="h-11 rounded-xl" />
					</div>
				))}
			</div>
		</>
	),
	detail: () => (
		<>
			<Title />
			<Bar className="h-48 rounded-2xl md:h-64" />
			<Rows count={3} />
		</>
	),
	list: () => (
		<>
			<Title />
			<Bar className="h-11 rounded-xl" />
			<Rows count={6} />
		</>
	),
};

export default function PageSkeleton({ url }) {
	const Variant = VARIANTS[skeletonVariant(url)];

	return (
		<div
			role="status"
			aria-busy="true"
			aria-label="Memuat halaman"
			// Masuk dengan fade, bukan muncul mendadak (CSS animation = di luar main thread).
			className="relative flex w-full flex-col space-y-6 duration-150 ease-spring animate-in fade-in-0"
		>
			<Variant />
		</div>
	);
}
