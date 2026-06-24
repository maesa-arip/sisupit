import { Button } from '@/Components/ui/button';

export default function DangerButton({ className = '', disabled, children, ...props }) {
	return (
		<Button
			{...props}
			variant="destructive"
			className={className}
			disabled={disabled}
		>
			{children}
		</Button>
	);
}
