import { Button } from '@/Components/ui/button';

export default function SecondaryButton({ type = 'button', className = '', disabled, children, ...props }) {
	return (
		<Button
			{...props}
			type={type}
			variant="secondary"
			className={className}
			disabled={disabled}
		>
			{children}
		</Button>
	);
}
