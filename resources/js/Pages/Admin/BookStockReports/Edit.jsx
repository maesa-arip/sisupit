import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconCategory, IconStack3 } from '@tabler/icons-react';
import { useRef } from 'react';
import { toast } from 'sonner';

export default function Edit(props) {
	const { data, setData, reset, post, processing, errors } = useForm({
		total: props.stock.total ?? 0,
		available: props.stock.available ?? 0,
		loan: props.stock.loan ?? 0,
		lost: props.stock.lost ?? 0,
		damaged: props.stock.damaged ?? 0,
		_method: props.page_settings.method,
	});

	const calculateMinimumTotal = (available,loan,lost,damaged) => {
		return available + loan + lost + damaged;
	}
	const onHandleChange = (e) => {
		const { name, value } = e.target;
		const newValue = parseInt(value,10) || 0;
		setData((prevData) => {
			if (name === 'total') {
				const minimumTotal = calculateMinimumTotal(
					prevData.available,
					prevData.loan,
					prevData.lost,
					prevData.damaged,
				);
				const validTotal = newValue >= minimumTotal ? newValue : minimumTotal;
				const totalDiff = validTotal - prevData.total;
				const newAvailable = prevData.available + totalDiff;

				return {
					...prevData,
					total : validTotal,
					available : newAvailable >= 0 ? newAvailable : 0,
				};
			}
			return {
				...prevData,
				[name] : newValue,
			};
		});
	};

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
					icon={IconStack3}
				/>
				<Button variant="orange" size="sm" asChild>
					<Link href={route('admin.book-stock-reports.index')}>
						<IconArrowLeft className="size-4" />
						Kembali
					</Link>
				</Button>
			</div>
			<Card>
				<CardContent className="p-6">
					<form className="space-y-6" onSubmit={onHandleSubmit}>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="total">Total</Label>
							<Input
								name="total"
								id="total"
								value={data.total}
								type="number"
								onChange={onHandleChange}
							/>
							{errors.total && <InputError message={errors.total} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="available">Tersedia</Label>
							<Input
								name="available"
								id="available"
								value={data.available}
								type="number"
								onChange={onHandleChange}
								disabled
							/>
							{errors.available && <InputError message={errors.available} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="loan">Dipinjam</Label>
							<Input
								name="loan"
								id="loan"
								value={data.loan}
								type="number"
								onChange={onHandleChange}
								disabled
							/>
							{errors.loan && <InputError message={errors.loan} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="lost">Hilang</Label>
							<Input
								name="lost"
								id="lost"
								value={data.lost}
								type="number"
								onChange={onHandleChange}
								disabled
							/>
							{errors.lost && <InputError message={errors.lost} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="damaged">Rusak</Label>
							<Input
								name="damaged"
								id="damaged"
								value={data.damaged}
								type="number"
								onChange={onHandleChange}
								disabled
							/>
							{errors.damaged && <InputError message={errors.damaged} />}
						</div>
						
						<div className="flex justify-end gap-x-2">
							<Button type="button" variant="ghost" size="sm" onClick={onHandleReset}>
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
