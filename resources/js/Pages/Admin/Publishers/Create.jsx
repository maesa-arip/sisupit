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
import { IconArrowLeft, IconBuildingCommunity } from '@tabler/icons-react';
import { useRef } from 'react';
import { toast } from 'sonner';

export default function Create(props) {
	const fileInputLogo = useRef(null);
	const { data, setData, reset, post, processing, errors } = useForm({
		name: '',
		address: '',
		email: '',
		phone: '',
		logo: null,
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
		fileInputLogo.current.value = null;
	};
	return (
		<div className="flex w-full flex-col pb-32">
			<div className="mb-8 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconBuildingCommunity}
				/>
				<Button variant="orange" size="sm" asChild>
					<Link href={route('admin.publishers.index')}>
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
							<Label htmlFor="address">Alamat</Label>
							<Textarea
								name="address"
								id="address"
								value={data.address}
								placeholder="Masukan alamat..."
								onChange={onHandleChange}
							/>
							{errors.address && <InputError message={errors.address} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="email">Email</Label>
							<Input
								name="email"
								id="email"
								value={data.email}
								type="text"
								placeholder="Masukan email..."
								onChange={onHandleChange}
							/>
							{errors.email && <InputError message={errors.email} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="phone">Nomor Handphone</Label>
							<Input
								name="phone"
								id="phone"
								value={data.phone}
								type="text"
								placeholder="Masukan nomor handphone..."
								onChange={onHandleChange}
							/>
							{errors.phone && <InputError message={errors.phone} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="logo">Logo</Label>
							<Input
								name="logo"
								id="logo"
								type="file"
								ref={fileInputLogo}
								onChange={(e) => setData(e.target.name, e.target.files[0])}
							/>
							{errors.logo && <InputError message={errors.logo} />}
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
Create.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
