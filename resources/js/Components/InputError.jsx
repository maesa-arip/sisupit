import { cn } from '@/lib/utils';

export default function InputError({ message, className = '', ...props }) {
	return message ? (
		<p data-input-error {...props} className={cn('text-xs font-medium text-destructive', className)}>
			{message}
		</p>
	) : null;
}
