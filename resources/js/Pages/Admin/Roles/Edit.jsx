import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconCircleKey } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function Edit(props) {
	const { data, setData, reset, post, processing, errors } = useForm({
		name: props.role.name ?? '',
		guard_name: props.role.guard_name ?? 'web',
		_method: props.page_settings.method,
	});
	const onHandleChange = (e) => setData(e.target.name, e.target.value);

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
		<div className="flex w-full flex-col pb-32">
			<div className="mb-8 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconCircleKey}
				/>
				<Button variant="outline" size="sm" className="rounded-full" asChild>
					<Link href={route('admin.roles.index')}>
						<IconArrowLeft className="size-4" />
						Kembali
					</Link>
				</Button>
			</div>
			<Card className="mx-auto w-full max-w-2xl">
				<CardContent className="p-5 sm:p-6">
					<form
						className="divide-y divide-border/70 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0 [&>*]:py-4"
						onSubmit={onHandleSubmit}
					>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="name">Nama</Label>
							<Input
								name="name"
								id="name"
								value={data.name}
								type="text"
								placeholder="Masukkan nama..."
								onChange={onHandleChange}
							/>
							{errors.name && <InputError message={errors.name} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="guard_name">Guard</Label>
							<Select value={data.guard_name} onValueChange={(value) => setData('guard_name', value)}>
								<SelectTrigger>
									<SelectValue>
										{['web', 'api'].find((guard) => guard === data.guard_name) ?? 'Pilih Guard'}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{['web', 'api'].map((guard, index) => (
										<SelectItem key={index} value={guard}>
											{guard.charAt(0).toUpperCase() + guard.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.guard_name && <InputError message={errors.guard_name} />}
						</div>

						<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<Button
								type="button"
								variant="ghost"
								className="h-11 w-full rounded-xl sm:w-auto"
								onClick={onHandleReset}
							>
								Atur ulang
							</Button>
							<Button
								type="submit"
								className="h-11 w-full rounded-xl px-6 sm:w-auto"
								disabled={processing}
							>
								Simpan
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
Edit.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
