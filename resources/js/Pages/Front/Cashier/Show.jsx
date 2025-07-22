import BookCard from '@/Components/BookCard';
import CategoryCard from '@/Components/CategoryCard';
import HeaderTitle from '@/Components/HeaderTitle';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/Components/ui/pagination';
import UseFilter from '@/hooks/UseFilter';
import AppLayout from '@/Layouts/AppLayout';
import { IconCategory } from '@tabler/icons-react';
import { useState } from 'react';

export default function Show(props) {
	const { data: books, meta } = props.books;
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
		<div className="flex flex-col w-full space-y-6">
			<div className="flex flex-col items-start justify-between mb-8 gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconCategory}
				/>
			</div>
            <div className='grid gap-4 pt-10 md:gap-8 lg:grid-cols-4'>
                {books.map((book,index)=>(
                    <BookCard key={index} item={book}/>
                ))}
            </div>
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
		</div>
	);
}

Show.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
