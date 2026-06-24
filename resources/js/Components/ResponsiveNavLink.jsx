import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({ active = false, className = '', children, ...props }) {
	return (
		<Link
			{...props}
			className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
				active
					? 'border-indigo-400 dark:border-info bg-indigo-50 dark:bg-info/10 text-indigo-700 dark:text-info focus:border-indigo-700 dark:focus:border-info focus:bg-indigo-100 dark:focus:bg-info/20 focus:text-indigo-800 dark:focus:text-info'
					: 'border-transparent text-muted-foreground hover:border-border hover:bg-accent hover:text-accent-foreground focus:border-border focus:bg-accent focus:text-accent-foreground'
			} text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
		>
			{children}
		</Link>
	);
}
