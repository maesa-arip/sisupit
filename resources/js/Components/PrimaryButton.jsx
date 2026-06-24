import { Button } from '@/Components/ui/button';

export default function PrimaryButton({ className = '', disabled, children, ...props }) {
	return (
		<Button
			{...props}
			variant="default"
			className={className}
			disabled={disabled}
		>
			{children}
		</Button>
	);
}
