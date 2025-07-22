import ThemeSwitcher from '@/Components/ThemeSwitcher';
import { Head } from '@inertiajs/react';

export default function GuestLayout({ children, title }) {
	return (
		<>
			<Head title={title} />
			{children}
		</>
	);
}
