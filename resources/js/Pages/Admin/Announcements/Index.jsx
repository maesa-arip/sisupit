import HeaderTitle from '@/Components/HeaderTitle';
import PaginationLinks from '@/Components/PaginationLinks';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/Components/ui/alert-dialog';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardFooter } from '@/Components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	stickyActionsClass,
} from '@/Components/ui/table';
import AppLayout from '@/Layouts/AppLayout';
import { cn, flashMessage } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { IconAlertCircle, IconChevronRight, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';

// Satu dialog hapus untuk tabel desktop & daftar ponsel (TASK_69), supaya keduanya tak menyimpang.
function DeleteAnnouncementDialog({ announcement }) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="red" size="sm" aria-label="Hapus pengumuman">
					<IconTrash size="4" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Hapus data ini?</AlertDialogTitle>
					<AlertDialogDescription>
						Tindakan ini tidak dapat dibatalkan. Tindakan ini akan menghapus data ini secara permanen dari
						server.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Batal</AlertDialogCancel>
					<AlertDialogAction
						onClick={() =>
							router.delete(route('admin.announcements.destroy', [announcement]), {
								preserveScroll: true,
								preserveState: true,
								onSuccess: (success) => {
									const flash = flashMessage(success);
									if (flash) toast[flash.type](flash.message);
								},
							})
						}
					>
						Hapus
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default function Index(props) {
	const { data: announcements, meta } = props.announcements;

	return (
		<div className="flex w-full flex-col pb-32">
			<div className="mb-8 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconAlertCircle}
				/>
				<Button className="h-10 rounded-full px-4" size="sm" asChild>
					<Link href={route('admin.announcements.create')}>
						<IconPlus className="size-4" /> Tambah
					</Link>
				</Button>
			</div>
			<Card>
				<CardContent className="px-0 py-0 [&-td]:whitespace-nowrap [&_td]:px-6 [&_th]:px-6">
					{/* Ponsel: daftar bergrup ala iOS; ketuk baris = ubah. Tabel lengkap mulai md. */}
					<ul className="divide-y divide-border/70 md:hidden">
						{announcements.map((announcement, index) => (
							<li key={index} className="flex items-center gap-3 px-4 py-3">
								<Link
									href={route('admin.announcements.edit', [announcement])}
									className="flex min-w-0 flex-1 items-center gap-3 rounded-lg transition-opacity active:opacity-70"
								>
									<span className="min-w-0 flex-1">
										<span className="line-clamp-2 text-[15px] font-medium text-foreground">
											{announcement.message}
										</span>
										<span className="mt-1 flex items-center gap-2 text-[13px] text-muted-foreground">
											<span
												className={cn(
													'rounded-full px-2 py-0.5 text-[11px] font-semibold',
													announcement.is_active === 'Aktif'
														? 'bg-success/10 text-success'
														: 'bg-muted text-muted-foreground',
												)}
											>
												{announcement.is_active}
											</span>
											{announcement.created_at}
										</span>
									</span>
									<IconChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
								</Link>
								<DeleteAnnouncementDialog announcement={announcement} />
							</li>
						))}
						{announcements.length === 0 && (
							<li className="px-4 py-10 text-center text-[15px] text-muted-foreground">
								Belum ada pengumuman.
							</li>
						)}
					</ul>
					<div className="hidden md:block">
						<Table className={`w-full ${stickyActionsClass}`}>
							<TableHeader>
								<TableRow>
									<TableHead className="hidden md:table-cell">#</TableHead>
									<TableHead>Pesan</TableHead>
									<TableHead className="hidden md:table-cell">URL</TableHead>
									<TableHead>Aktif</TableHead>
									<TableHead className="hidden md:table-cell">Dibuat Pada</TableHead>
									<TableHead>Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{announcements.map((announcement, index) => (
									<TableRow key={index}>
										<TableCell className="hidden md:table-cell">
											{index + 1 + (meta.current_page - 1) * meta.per_page}
										</TableCell>
										<TableCell>{announcement.message}</TableCell>
										<TableCell className="hidden md:table-cell">{announcement.url}</TableCell>
										<TableCell>{announcement.is_active}</TableCell>
										<TableCell className="hidden md:table-cell">
											{announcement.created_at}
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-x-1">
												<Button variant="blue" size="sm" asChild>
													<Link href={route('admin.announcements.edit', [announcement])}>
														<IconPencil className="size-4" />
													</Link>
												</Button>
												<DeleteAnnouncementDialog announcement={announcement} />
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
				<CardFooter className="flex w-full flex-col items-center justify-between border-t py-2 lg:flex-row">
					<p className="mb-2 text-sm text-muted-foreground">
						Menampilkan <span className="font-medium text-foreground">{meta.from ?? 0}</span> dari{' '}
						{meta.total} Pengumuman
					</p>
					<div className="overflow-x-auto">
						<PaginationLinks links={meta.links} />
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
