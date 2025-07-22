import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { MultiSelect } from '@/Components/MultiSelect';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconKeyframe, IconLayoutKanban } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Edit(props) {
	// console.log(props);
	const [selectedRoles, setSelectedRoles] = useState(
		Array.from(new Set(props.user.roles.map((role) => role.id))),
	);
	const { data, setData, reset, post, processing, errors } = useForm({
		email: props.user.email ?? '',
		roles: selectedRoles,
		_method: props.page_settings.method,
	});
	const onHandleChange = (e) => setData(e.target.name, e.target.value);
	const hanldeRoleChange = (selected) => {
		setSelectedRoles(selected);
		setData('roles', selected);
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
					icon={IconLayoutKanban}
				/>
				<Button variant="orange" size="sm" asChild>
					<Link href={route('admin.assign-users.index')}>
						<IconArrowLeft className="size-4" />
						Kembali
					</Link>
				</Button>
			</div>
			<Card>
				<CardContent className="p-6">
					<form className="space-y-6" onSubmit={onHandleSubmit}>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="email">Email</Label>
							<Input
								name="email"
								id="email"
								value={data.email}
								type="text"
								placeholder="Masukan nama..."
								onChange={onHandleChange}
								disabled
							/>
							{errors.email && <InputError message={errors.email} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="roles">Peran</Label>
							<MultiSelect
								options={props.roles}
								onValueChange={hanldeRoleChange}
								defaultValue={selectedRoles}
								placeholder="Pilih Peran"
								variant='inverted'
							/>
							{errors.roles && <InputError message={errors.roles} />}
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
