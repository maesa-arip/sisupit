import HeaderTitle from '@/Components/HeaderTitle';
import PaginationLinks from '@/Components/PaginationLinks';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Switch } from '@/Components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import UseFilter from '@/hooks/UseFilter';
import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { IconArrowsDownUp, IconPencil, IconRefresh, IconSettings } from '@tabler/icons-react';
import { useState } from 'react';

export default function Index(props) {
	const { data: settings, meta } = props.settings;
	const [params, setParams] = useState(props.state);
	console.log(settings);
	// console.log(props.state);

	const onSortable = (field) => {
		setParams({
			...params,
			field: field,
			direction: params.direction === 'asc' ? 'desc' : 'asc',
		});
	};
	UseFilter({
		route: route('front.settings.index'),
		values: params,
		only: ['settings'],
	});
	return (
		<div className="flex w-full flex-col pb-32">
			<div className="mb-8 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconSettings}
				/>
			</div>
			<Card>
				<CardHeader>
					<div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center">
						<Input
							className="w-full sm:w-1/4"
							placeholder="Cari"
							value={params?.search}
							onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value }))}
						/>
						<Select value={params?.load} onValueChange={(e) => setParams({ ...params, load: e })}>
							<SelectTrigger className="w-full sm:w-24">
								<SelectValue placeholder="Jumlah" />
							</SelectTrigger>
							<SelectContent>
								{[10, 25, 50, 75, 100].map((number, index) => (
									<SelectItem key={index} value={number}>
										{number}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button variant="red" onClick={() => setParams(props.state)}>
							<IconRefresh className="size-4" /> Bersihkan
						</Button>
					</div>
				</CardHeader>
				<CardContent className="px-0 py-0 [&-td]:whitespace-nowrap [&_td]:px-6 [&_th]:px-6">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead>
									<Link
										variant="ghost"
										className="group inline-flex"
										onClick={() => onSortable('id')}
									>
										#{' '}
										<span className="ml-2 flex-none rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Link>
								</TableHead>
								<TableHead>
									<Link
										variant="ghost"
										className="group inline-flex"
										onClick={() => onSortable('name')}
									>
										Nama
										<span className="ml-2 flex-none rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Link>
								</TableHead>
								<TableHead>
									<Link
										variant="ghost"
										className="group inline-flex"
										// onClick={() => onSortable('slug')}
									>
										Keterangan
										<span className="ml-2 flex-none rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Link>
								</TableHead>
								<TableHead>
									<Link
										variant="ghost"
										className="group inline-flex"
										onClick={() => onSortable('created_at')}
									>
										Status
										<span className="ml-2 flex-none rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Link>
								</TableHead>
								<TableHead> Nilai</TableHead>
								<TableHead>Aksi</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{settings.map((setting, index) => (
								<TableRow key={index}>
									<TableCell>{index + 1 + (meta.current_page - 1) * meta.per_page}</TableCell>
									<TableCell>{setting.display_name}</TableCell>
									<TableCell>
										<Alert>
											{/* <AlertCircle className="w-4 h-4 text-muted-foreground" /> */}
											{/* <AlertTitle className='text-muted-foreground'>Keterangan</AlertTitle> */}
											<AlertDescription className="text-muted-foreground">
												{setting.description}
											</AlertDescription>
										</Alert>
									</TableCell>
									<TableCell>
										<div className="flex items-center space-x-2">
											{setting.name == 'ppn' ? (
												<Switch
													id="isActive"
													disabled
													aria-readonly
													checked={setting.status}
													// onCheckedChange={(checked) =>
													//   setNewDiscount({ ...newDiscount, isActive: checked })
													// }
												/>
											) : (
												<Switch
													id="isActive"
													checked={setting.status}
													// onCheckedChange={(checked) =>
													//   setNewDiscount({ ...newDiscount, isActive: checked })
													// }
												/>
											)}
											<span
												className={
													setting.status
														? 'text-green-600 dark:text-success'
														: 'text-muted-foreground'
												}
											>
												{setting.status ? 'Aktif' : 'Tidak Aktif'}
											</span>
										</div>
									</TableCell>
									<TableCell>{setting.name == 'ppn' ? setting.amount + '%' : ''}</TableCell>
									<TableCell>
										<div className="flex items-center gap-x-1">
											{setting.name == 'ppn' ? (
												<Button variant="blue" size="sm" asChild>
													<Link href={route('front.settings.edit', [setting])}>
														<IconPencil className="size-4" />
													</Link>
												</Button>
											) : (
												''
											)}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
				<CardFooter className="flex w-full flex-col items-center justify-between border-t py-2 lg:flex-row">
					<p className="mb-2 text-sm text-muted-foreground">
						Menamplikan <span className="font-medium text-primary">{meta.from ?? 0}</span> dari {meta.total}{' '}
						Pengaturan
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
