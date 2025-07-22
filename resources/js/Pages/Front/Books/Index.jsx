import BookCard from '@/Components/BookCard';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/Components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import UseFilter from '@/hooks/UseFilter';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { IconArrowsDownUp, IconBooks, IconPencil, IconPlus, IconRefresh, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Index(props) {
    const { data: categories, meta } = props.categories;
    const [params, setParams] = useState(props.state);
    // console.log(books);

    const onSortable = (field) => {
        setParams({
            ...params,
            field: field,
            direction: params.direction === 'asc' ? 'desc' : 'asc',
        });
    };
    UseFilter({
        route: route('front.books.index'),
        values: params,
        only: ['categories'],
    });

    return (
        <div className="flex flex-col w-full pb-32">
            <div className="flex flex-col items-start justify-between mb-8 gap-y-4 lg:flex-row lg:items-center">
                <HeaderTitle
                    title={props.page_settings.title}
                    subtitle={props.page_settings.subtitle}
                    icon={IconBooks}
                />
            </div>
            {props.categories.map((category,index)=>(
                <div key={index} className='py-2'>
                    <div className='flex items-center justify-between'>
                        <h2 className='font-semibold leading-relaxed text-foreground'>{category.name}</h2>
                        <Button variant='link' asChild>
                            <Link href={route('front.categories.show',[category.slug])}>Lihat Semua</Link>
                        </Button>
                    </div>
                    <div className='grid gap-4 py-10 border-b border-dashed border-muted md:gap-8 lg:grid-cols-4'>
                        {category.books.map((book,index)=>(
                            <BookCard key={index} item={book}/>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

Index.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
