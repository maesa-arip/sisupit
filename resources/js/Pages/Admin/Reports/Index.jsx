import HeaderTitle from '@/Components/HeaderTitle';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/Components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import UseFilter from '@/hooks/UseFilter';
import { cn } from '@/lib/utils';
import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { IconClipboardPlus, IconEye, IconFileSpreadsheet } from '@tabler/icons-react';
import { useState } from 'react';

const STATUS_OPTIONS = ['Semua', 'TERLAPOR', 'pending', 'handling', 'resolved'];

const STATUS_BADGE = {
    TERLAPOR: { className: 'bg-destructive/10 text-destructive border-destructive/20', label: 'TERLAPOR' },
    pending: { className: 'bg-destructive/10 text-destructive border-destructive/20', label: 'MENUNGGU' },
    handling: { className: 'bg-warning/10 text-warning border-warning/20', label: 'PENANGANAN' },
    resolved: { className: 'bg-success/10 text-success border-success/20', label: 'SELESAI' },
};

function StatusBadge({ status }) {
    const active = STATUS_BADGE[status] || STATUS_BADGE.pending;
    return (
        <Badge variant="outline" className={cn('font-bold px-2 py-0.5 rounded-md shadow-none whitespace-nowrap', active.className)}>
            {active.label}
        </Badge>
    );
}

export default function Index(props) {
    const { data: reports, links, current_page, per_page, last_page, from, total } = props.reports;
    const [params, setParams] = useState(props.state);

    UseFilter({
        route: route('admin.reports.index'),
        values: params,
        only: ['reports'],
    });

    return (
        <div className="flex flex-col w-full pb-32">
            <div className="flex flex-col items-start justify-between mb-8 gap-y-4 lg:flex-row lg:items-center">
                <HeaderTitle
                    title={props.page_settings.title}
                    subtitle={props.page_settings.subtitle}
                    icon={IconClipboardPlus}
                />
                <Button variant="outline" size="sm" asChild>
                    <a href={route('admin.reports.export', { search: params?.search, status: params?.status })}>
                        <IconFileSpreadsheet className="size-4" /> Export Excel
                    </a>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col w-full gap-4 lg:flex-row lg:items-center">
                        <Input
                            className="w-full sm:w-1/4"
                            placeholder="Cari judul, alamat, atau pelapor..."
                            value={params?.search}
                            onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value }))}
                        />
                        <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setParams((prev) => ({ ...prev, status }))}
                                    className={cn(
                                        'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                                        params?.status === status
                                            ? 'border-primary/30 bg-primary/10 text-primary'
                                            : 'border-input bg-transparent text-muted-foreground hover:bg-accent',
                                    )}
                                >
                                    {status === 'Semua' ? 'Semua' : (STATUS_BADGE[status]?.label ?? status)}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-0 py-0 [&_td]:whitespace-nowrap [&_td]:px-6 [&_th]:px-6">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Judul Kejadian</TableHead>
                                <TableHead>Pelapor</TableHead>
                                <TableHead>Telepon</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Alamat</TableHead>
                                <TableHead>Dilaporkan Pada</TableHead>
                                <TableHead>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.length > 0 ? (
                                reports.map((report, index) => (
                                    <TableRow key={report.id}>
                                        <TableCell>{index + 1 + (current_page - 1) * per_page}</TableCell>
                                        <TableCell className="font-medium">{report.title}</TableCell>
                                        <TableCell>{report.name ?? report.user?.name}</TableCell>
                                        <TableCell>{report.phone}</TableCell>
                                        <TableCell><StatusBadge status={report.status} /></TableCell>
                                        <TableCell className="max-w-xs truncate">{report.address}</TableCell>
                                        <TableCell>
                                            {new Date(report.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={route('reports.show', report.id)}>
                                                    <IconEye className="size-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                                        Tidak ada laporan yang ditemukan.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex flex-col items-center justify-between w-full py-2 border-t lg:flex-row">
                    <p className="mb-2 text-sm text-muted-foreground">
                        Menampilkan <span className="font-medium text-orange-500 dark:text-warning">{from ?? 0}</span> dari{' '}
                        {total} laporan
                    </p>
                    <div className="overflow-x-auto">
                        {last_page > 1 && (
                            <Pagination>
                                <PaginationContent className="flex justify-center flex-wrap lg:justify-end">
                                    {links.map((link, index) => (
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
