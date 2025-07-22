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
import { IconArrowLeft, IconCategory } from '@tabler/icons-react';
import { useRef } from 'react';
import { toast } from 'sonner';

export default function Create(props) {
	const fileInputCover = useRef(null);
	const { data, setData, reset, post, processing, errors } = useForm({
		name: '',
		description: '',
		cover: null,
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
		fileInputCover.current.value = null;
	};
	return (
		<div className="flex flex-col w-full pb-32">
			<div className="flex flex-col items-start justify-between mb-8 gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconCategory}
				/>
				<Button variant="orange" size="sm" asChild>
					<Link href={route('admin.categories.index')}>
						<IconArrowLeft className="size-4" />
						Kembali
					</Link>
				</Button>
			</div>
			<Card>
				<CardContent className="p-6">
					<form className="space-y-6" onSubmit={onHandleSubmit}>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="name">Nama</Label>
							<Input
								name="name"
								id="name"
								value={data.name}
								type="text"
								placeholder="Masukan nama..."
								onChange={onHandleChange}
							/>
							{errors.name && <InputError message={errors.name} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="description">Deskripsi</Label>
							<Textarea
								name="description"
								id="description"
								value={data.description}
								placeholder="Masukan deskripsi..."
								onChange={onHandleChange}
							/>
							{errors.description && <InputError message={errors.description} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="cover">Cover</Label>
							<Input
								name="cover"
								id="cover"
								type="file"
								ref={fileInputCover}
								onChange={(e) => setData(e.target.name, e.target.files[0])}
							/>
							{errors.cover && <InputError message={errors.cover} />}
						</div>
						<div className="flex justify-end gap-x-2">
							<Button type="button" variant="secondary" size="sm" disabled={processing} onClick={onHandleReset}>
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
Create.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
