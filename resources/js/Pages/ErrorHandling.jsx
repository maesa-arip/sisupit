import { Button } from '@/Components/ui/button';
import { messages } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { IconAlertTriangle } from '@tabler/icons-react';

// Layar galat ala iOS (TASK_69, apple-design): tanpa kartu, satu ikon tenang, kode status kecil,
// judul besar, satu aksi. Teks tetap dari `messages[status]` di lib/utils.js.
export default function ErrorHandling({ status }) {
	const errorMessages = messages[status];
	return (
		<>
			<Head title={errorMessages.title} />
			<div className="grid min-h-[70vh] place-items-center bg-background px-6 py-16 sm:py-24">
				<div className="flex max-w-md flex-col items-center text-center">
					<span className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 text-warning">
						<IconAlertTriangle className="h-8 w-8" stroke={1.75} />
					</span>
					<p className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
						{errorMessages.status}
					</p>
					<h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
						{errorMessages.title}
					</h1>
					<p className="mt-4 text-[15px] leading-relaxed text-muted-foreground sm:text-[17px]">
						{errorMessages.description}
					</p>
					<Button className="mt-8 h-11 rounded-full px-6 text-[15px] font-semibold" asChild>
						<Link href="/">Kembali ke halaman awal</Link>
					</Button>
				</div>
			</div>
		</>
	);
}
