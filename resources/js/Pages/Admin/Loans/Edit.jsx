import ComboBox from '@/Components/ComboBox';
import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconBooks, IconCreditCardPay } from '@tabler/icons-react';
import { useRef } from 'react';
import { toast } from 'sonner';

export default function Edit(props) {
	const { data, setData, reset, post, processing, errors } = useForm({
		user: props.page_data.loan.user.name ?? null,
        book:props.page_data.loan.book.title ?? null,
        loan_date:props.page_data.date.loan_date,
        due_date:props.page_data.date.due_date,
		_method: props.page_settings.method,
	});
   

	const onHandleSubmit = (e) => {
		e.preventDefault();
		post(props.page_settings.action, {
			preserveScroll: true,
			preserveState: true,
			onSuccess: (success) => {
				const flash = flashMessage(success);
				if (flash) toast[flash.type](flash.message);
			},
		});
	};
	const onHandleReset = () => {
		reset();
	};
	return (
		<div className="flex flex-col w-full pb-32">
			<div className="flex flex-col items-start justify-between mb-8 gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconCreditCardPay}
				/>
				<Button variant="orange" size="sm" asChild>
					<Link href={route('admin.loans.index')}>
						<IconArrowLeft className="size-4" />
						Kembali
					</Link>
				</Button>
			</div>
			<Card>
				<CardContent className="p-6">
					<form className="space-y-6" onSubmit={onHandleSubmit}>
						
						

						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="user">Nama</Label>
							<ComboBox
                                items={props.page_data.users}
                                selectedItem={data.user}
                                onSelect={(currentValue)=>setData('user',currentValue)}
                            />
							{errors.user && <InputError message={errors.user} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="book">Buku</Label>
							<ComboBox
                                items={props.page_data.books}
                                selectedItem={data.book}
                                onSelect={(currentValue)=>setData('book',currentValue)}
                            />
							{errors.book && <InputError message={errors.book} />}
						</div>
						<div className="flex justify-end gap-x-2">
							<Button type="button" variant="secondary" size="sm" onClick={onHandleReset}>
								Reset
							</Button>
							<Button type="submit" variant="orange" size="sm" disabled={processing}>
								Save
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
Edit.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
