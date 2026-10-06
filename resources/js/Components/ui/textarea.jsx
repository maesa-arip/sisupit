import * as React from 'react';

import { cn } from '@/lib/utils';

// autoComplete bawaan "off" (#186), alasan sama dengan ui/input.jsx.
const Textarea = React.forwardRef(({ className, autoComplete = 'off', ...props }, ref) => {
	return (
		<textarea
			autoComplete={autoComplete}
			className={cn(
				'flex min-h-24 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
});
Textarea.displayName = 'Textarea';

export { Textarea };
