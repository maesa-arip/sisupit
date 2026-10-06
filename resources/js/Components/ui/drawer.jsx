'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import PullToRefreshLock from '@/lib/pull-to-refresh-lock';
import { cn } from '@/lib/utils';

/**
 * Lembar bawah gaya iOS (apple-design §2-§6, §12). vaul memegang fisikanya: lembar mengikuti
 * jari 1:1 dari titik pegangnya, lemparan memproyeksikan momentum (ditutup bila arah lemparnya
 * ke bawah meski baru sedikit terseret), mantul lembut di batas atas, dan kurva masuk/keluarnya
 * `cubic-bezier(0.32, 0.72, 0, 1)` - kurva yang sama dengan `ease-spring` di tailwind.config.js.
 *
 * Dipakai bilah bawah (MobileBottomNav, 2026-10-07) untuk panel Fasilitas & Menu.
 * `shouldScaleBackground` bawaannya MATI: tak ada `[vaul-drawer-wrapper]` di AppLayout, dan
 * tanpa pembungkus itu vaul justru menskala <body> sehingga header sticky ikut bergeser.
 */
const Drawer = ({ shouldScaleBackground = false, ...props }) => (
	<DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);
Drawer.displayName = 'Drawer';

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

// Scrim peredup (§12 "dim to focus"): tugas di lembar ini modal, latar didorong mundur.
const DrawerOverlay = React.forwardRef(({ className, ...props }, ref) => (
	<DrawerPrimitive.Overlay ref={ref} className={cn('fixed inset-0 z-50 bg-black/40', className)} {...props} />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

/*
 * Permukaannya `material-thick` (kaca tebal, padat bila transparansi dikurangi) - JANGAN tambah
 * `bg-*` di sini: utilitas menang atas komponen dan materialnya diam-diam jadi padat.
 * Sudut 28px mengikuti lembar iOS di ponsel tanpa bingkai; tepi atas terang = cahaya di tepi kaca.
 * PullToRefreshLock: daftar di dalam lembar bisa digulir, dan tanpa kunci ini menggulir ke atas
 * memuat ulang halaman di APK (DialogPullToRefreshTest). Konten hanya terpasang selama terbuka.
 */
const DrawerContent = React.forwardRef(({ className, children, ...props }, ref) => (
	<DrawerPortal>
		<DrawerOverlay />
		<DrawerPrimitive.Content
			ref={ref}
			className={cn(
				'material-thick fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[88dvh] flex-col rounded-t-[28px] border-t border-white/50 text-popover-foreground shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.35)] outline-none dark:border-white/10',
				className,
			)}
			{...props}
		>
			<PullToRefreshLock />
			{/* Grabber iOS (36x5). Dekoratif: menutup yang dapat diakses = ketuk scrim / Esc. */}
			<div aria-hidden="true" className="mx-auto mt-2 h-[5px] w-9 shrink-0 rounded-full bg-muted-foreground/40" />
			{children}
		</DrawerPrimitive.Content>
	</DrawerPortal>
));
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = ({ className, ...props }) => (
	<div className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)} {...props} />
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({ className, ...props }) => (
	<div className={cn('mt-auto flex flex-col gap-2 p-4', className)} {...props} />
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef(({ className, ...props }, ref) => (
	<DrawerPrimitive.Title
		ref={ref}
		className={cn('text-lg font-semibold leading-none tracking-tight', className)}
		{...props}
	/>
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef(({ className, ...props }, ref) => (
	<DrawerPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerOverlay,
	DrawerPortal,
	DrawerTitle,
	DrawerTrigger,
};
