import * as React from 'react';

import { cn } from '@/lib/utils';

const Table = React.forwardRef(({ className, ...props }, ref) => (
	<div className="relative w-full overflow-auto">
		<table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
	</div>
));
Table.displayName = 'Table';

// Kolom terakhir (Aksi) lengket di kanan (2026-10-02): tombol Ubah/Hapus selalu terlihat walau tabel
// lebih lebar dari layarnya dan harus digeser. Sel kepala mengulang tint `thead` (muted/40) di atas latar
// kartu yang padat supaya warnanya tak belang saat isi tabel lewat di bawahnya. Kelas harus LITERAL.
export const stickyActionsClass =
	'[&_td:last-child]:sticky [&_td:last-child]:right-0 [&_td:last-child]:bg-card [&_td:last-child]:shadow-[-8px_0_8px_-8px_hsl(var(--border))] [&_th:last-child]:sticky [&_th:last-child]:right-0 [&_th:last-child]:bg-card [&_th:last-child]:bg-[linear-gradient(hsl(var(--muted)/0.4),hsl(var(--muted)/0.4))] [&_th:last-child]:shadow-[-8px_0_8px_-8px_hsl(var(--border))]';

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
	<thead ref={ref} className={cn('bg-muted/40 [&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
	<tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
	<tfoot ref={ref} className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)} {...props} />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
	<tr
		ref={ref}
		className={cn(
			'border-b border-border/70 transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted',
			className,
		)}
		{...props}
	/>
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
	<th
		ref={ref}
		className={cn(
			'h-10 px-2 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
			className,
		)}
		{...props}
	/>
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
	<td
		ref={ref}
		className={cn(
			'p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
			className,
		)}
		{...props}
	/>
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
	<caption ref={ref} className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
));
TableCaption.displayName = 'TableCaption';

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
