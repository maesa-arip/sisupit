import * as React from 'react';

import { cn } from '@/lib/utils';

// autoComplete bawaan "off" (#186): tanpa itu browser/WebView memunculkan riwayat ketikan
// (patokan lokasi, nama OPD, kata kunci cari...) tiap kolom diketuk. Kolom data milik pengguna
// sendiri (email, sandi, nama, HP) WAJIB menulis autoComplete-nya sendiri agar isi-otomatis jalan.
const Input = React.forwardRef(({ className, type, size = 'h-10', autoComplete = 'off', ...props }, ref) => {
	return (
		<input
			type={type}
			autoComplete={autoComplete}
			className={cn(
				'flex w-full rounded-lg border border-input bg-transparent p-1.5 text-base shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
				size,
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
});
Input.displayName = 'Input';

export { Input };
