import HeaderTitle from '@/Components/HeaderTitle';
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/Components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { IconAlertCircle, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';

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
					<Table className="w-full">
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
									<TableCell className="hidden md:table-cell">{announcement.created_at}</TableCell>
									<TableCell>
										<div className="flex items-center gap-x-1">
											<Button variant="blue" size="sm" asChild>
												<Link href={route('admin.announcements.edit', [announcement])}>
													<IconPencil className="size-4" />
												</Link>
											</Button>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button variant="red" size="sm">
														<IconTrash size="4" />
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>Hapus data ini?</AlertDialogTitle>
														<AlertDialogDescription>
															Tindakan ini tidak dapat dibatalkan. Tindakan ini akan
															menghapus data ini secara permanen dari server.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Batal</AlertDialogCancel>
														<AlertDialogAction
															onClick={() =>
																router.delete(
																	route('admin.announcements.destroy', [
																		announcement,
																	]),
																	{
																		preserveScroll: true,
																		preserveState: true,
																		onSuccess: (success) => {
																			const flash = flashMessage(success);
																			if (flash) toast[flash.type](flash.message);
																		},
																	},
																)
															}
														>
															Hapus
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
				<CardFooter className="flex w-full flex-col items-center justify-between border-t py-2 lg:flex-row">
					<p className="mb-2 text-sm text-muted-foreground">
						Menampilkan <span className="font-medium text-foreground">{meta.from ?? 0}</span> dari{' '}
						{meta.total} Pengumuman
					</p>
					<div className="overflow-x-auto">
						{meta.has_pages && (
							<Pagination>
								<PaginationContent className="flex flex-wrap justify-center lg:justify-end">
									{meta.links.map((link, index) => (
										<PaginationItem key={index} className="mx-1 mb-1 lg:mb-0">
											<PaginationLink href={link.url} isActive={link.active}>
												{link.label}
											</PaginationLink>
										</PaginationItem>
									))}
								</PaginationContent>
							</Pagination>
						)}
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
