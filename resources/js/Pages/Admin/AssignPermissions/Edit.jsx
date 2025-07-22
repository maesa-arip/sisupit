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
import { IconArrowLeft, IconKeyframe } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Edit(props) {
	console.log(props);
	const [selectedPermissions, setSelectedPermissions] = useState(
		Array.from(new Set(props.role.permissions.map((permission) => permission.id))),
	);
	const { data, setData, reset, post, processing, errors } = useForm({
		name: props.role.name ?? '',
		permissions: selectedPermissions,
		_method: props.page_settings.method,
	});
	const onHandleChange = (e) => setData(e.target.name, e.target.value);
	const hanldePermissionChange = (selected) => {
		setSelectedPermissions(selected);
		setData('permissions', selected);
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
					icon={IconKeyframe}
				/>
				<Button variant="orange" size="sm" asChild>
					<Link href={route('admin.assign-permissions.index')}>
						<IconArrowLeft className="size-4" />
						Kembali
					</Link>
				</Button>
			</div>
			<Card>
				<CardContent className="p-6">
					<form className="space-y-6" onSubmit={onHandleSubmit}>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="name">Peran</Label>
							<Input
								name="name"
								id="name"
								value={data.name}
								type="text"
								placeholder="Masukan nama..."
								onChange={onHandleChange}
								disabled
							/>
							{errors.name && <InputError message={errors.name} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="permissions">Izin</Label>
							<MultiSelect
								options={props.permissions}
								onValueChange={hanldePermissionChange}
								defaultValue={selectedPermissions}
								placeholder="Pilih Izin"
								variant='inverted'
							/>
							{errors.permissions && <InputError message={errors.permissions} />}
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
