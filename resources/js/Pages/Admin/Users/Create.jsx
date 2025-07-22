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
import { IconArrowLeft, IconCategory, IconUsersGroup } from '@tabler/icons-react';
import { useRef } from 'react';
import { toast } from 'sonner';

export default function Create(props) {
	const fileInputAvatar = useRef(null);
	const { data, setData, reset, post, processing, errors } = useForm({
		name: '',
		email: '',
		password: '',
		password_confirmation: '',
		avatar: null,
		gender: null,
		date_of_birth:'',
		address:'',
		phone:'',
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
		fileInputAvatar.current.value = null;
	};
	return (
		<div className="flex flex-col w-full pb-32">
			<div className="flex flex-col items-start justify-between mb-8 gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconUsersGroup}
				/>
				<Button variant="orange" size="sm" asChild>
					<Link href={route('admin.users.index')}>
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
							<Label htmlFor="password">Password</Label>
							<Input
								name="password"
								id="password"
								value={data.password}
								type="password"
								placeholder="Masukan password..."
								onChange={onHandleChange}
							/>
							{errors.password && <InputError message={errors.password} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="password_confirmation">Konfirmasi Password</Label>
							<Input
								name="password_confirmation"
								id="password_confirmation"
								value={data.password_confirmation}
								type="password"
								placeholder="Masukan konfirmasi password..."
								onChange={onHandleChange}
							/>
							{errors.password_confirmation && <InputError message={errors.password_confirmation} />}
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
							<Label htmlFor="avatar">Avatar</Label>
							<Input
								name="avatar"
								id="avatar"
								type="file"
								ref={fileInputAvatar}
								onChange={(e) => setData(e.target.name, e.target.files[0])}
							/>
							{errors.avatar && <InputError message={errors.avatar} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="gender">Jenis Kelamin</Label>
							<Select
								defaultValue={data.gender}
								onValueChange={(value) => setData('gender', value)}
							>
								<SelectTrigger>
									<SelectValue>
										{props.genders.find(
											(gender) => gender.value == data.gender,
										)?.label ?? 'Pilih Jenis Kelamin'}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{props.genders.map((gender, index) => (
										<SelectItem key={index} value={gender.value}>
											{gender.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.gender && <InputError message={errors.gender} />}
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
