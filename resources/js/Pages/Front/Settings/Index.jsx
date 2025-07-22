import HeaderTitle from '@/Components/HeaderTitle';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/Components/ui/pagination';
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
		<div className="flex flex-col w-full pb-32">
			<div className="flex flex-col items-start justify-between mb-8 gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconSettings}
				/>
			</div>
			<Card>
				<CardHeader>
					<div className="flex flex-col w-full gap-4 lg:flex-row lg:items-center">
						<Input
							className="w-full sm:w-1/4"
							placeholder="Search"
							value={params?.search}
							onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value }))}
						/>
						<Select value={params?.load} onValueChange={(e) => setParams({ ...params, load: e })}>
							<SelectTrigger className="w-full sm:w-24">
								<SelectValue placeholder="load" />
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
										className="inline-flex group"
										onClick={() => onSortable('id')}
									>
										#{' '}
										<span className="flex-none ml-2 rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Link>
								</TableHead>
								<TableHead>
									<Link
										variant="ghost"
										className="inline-flex group"
										onClick={() => onSortable('name')}
									>
										Nama
										<span className="flex-none ml-2 rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Link>
								</TableHead>
								<TableHead>
									<Link
										variant="ghost"
										className="inline-flex group"
										// onClick={() => onSortable('slug')}
									>
										Keterangan
										<span className="flex-none ml-2 rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Link>
								</TableHead>
								<TableHead>
									<Link
										variant="ghost"
										className="inline-flex group"
										onClick={() => onSortable('created_at')}
									>
										Status
										<span className="flex-none ml-2 rounded text-muted-foreground">
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
											{/* <AlertCircle className="w-4 h-4 text-gray-500" /> */}
											{/* <AlertTitle className='text-gray-500'>Keterangan</AlertTitle> */}
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
											<span className={setting.status ? 'text-green-600' : 'text-gray-400'}>
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
				<CardFooter className="flex flex-col items-center justify-between w-full py-2 border-t lg:flex-row">
					<p className="mb-2 text-sm text-muted-foreground">
						Menamplikan <span className="font-medium text-orange-500">{meta.from ?? 0}</span> dari{' '}
						{meta.total} Pengaturan
					</p>
					<div className="overflow-x-auto">
						{meta.has_pages && (
							<Pagination>
								<PaginationContent className="flex justify-center fles-wrap lg:justify-end">
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
