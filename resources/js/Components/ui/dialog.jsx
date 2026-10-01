'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

// Tarik-untuk-refresh milik APK (SwipeRefreshLayout) merebut SETIAP tarikan ke bawah selama
// HALAMAN berada di puncak - ia tak tahu ada daftar bergulir di dalam dialog, jadi menggulir
// "Atur Anggota" ke atas malah memuat ulang halaman (permintaan user TASK_65). Selama sebuah
// dialog terbuka, halaman meminta APK mematikannya lewat AndroidBridge. Pemanggilannya
// OPSIONAL: APK lama tanpa method ini, browser, dan .exe tak terpengaruh. Hitungan dipakai
// karena dialog bisa bertumpuk - yang pertama tertutup tak boleh menyalakannya lagi.
let openDialogCount = 0;
const setNativePullToRefresh = (enabled) => {
	const bridge = typeof window !== 'undefined' ? window.AndroidBridge : null;
	if (bridge && typeof bridge.setPullToRefreshEnabled === 'function') bridge.setPullToRefreshEnabled(enabled);
};

// Dirender DI DALAM Content, yang hanya terpasang selama dialog terbuka - bukan di
// DialogContent sendiri, yang ikut dirender induknya walau dialog tertutup.
function PullToRefreshLock() {
	React.useEffect(() => {
		openDialogCount += 1;
		if (openDialogCount === 1) setNativePullToRefresh(false);
		return () => {
			openDialogCount -= 1;
			if (openDialogCount === 0) setNativePullToRefresh(true);
		};
	}, []);
	return null;
}

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
	<DialogPrimitive.Overlay
		ref={ref}
		className={cn(
			'fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] duration-300 ease-spring data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
			className,
		)}
		{...props}
	/>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
	<DialogPortal>
		<DialogOverlay />
		<DialogPrimitive.Content
			ref={ref}
			className={cn(
				'fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border bg-background p-6 shadow-lg duration-300 ease-spring data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-1/2',
				className,
			)}
			{...props}
		>
			<PullToRefreshLock />
			{children}
			<DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
				<X className="h-4 w-4" />
				<span className="sr-only">Close</span>
			</DialogPrimitive.Close>
		</DialogPrimitive.Content>
	</DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }) => (
	<div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }) => (
	<div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
	<DialogPrimitive.Title
		ref={ref}
		className={cn('text-lg font-semibold leading-none tracking-tight', className)}
		{...props}
	/>
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
	<DialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
};
