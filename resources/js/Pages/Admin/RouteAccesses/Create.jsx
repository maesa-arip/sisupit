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
import { IconArrowLeft, IconBooks, IconCreditCardPay, IconRoute } from '@tabler/icons-react';
import { useRef } from 'react';
import { toast } from 'sonner';

export default function Create(props) {
	const { data, setData, reset, post, processing, errors } = useForm({
		route_name: null,
        role:null,
        permission:null,
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
					icon={IconRoute}
				/>
				<Button variant="orange" size="sm" asChild>
					<Link href={route('admin.route-accesses.index')}>
						<IconArrowLeft className="size-4" />
						Kembali
					</Link>
				</Button>
			</div>
			<Card>
				<CardContent className="p-6">
					<form className="space-y-6" onSubmit={onHandleSubmit}>
						
						

						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="route_name">Rute</Label>
							<ComboBox
                                items={props.routes.filter((route)=>route.value !== null)}
                                selectedItem={data.route_name}
                                onSelect={(currentValue)=>setData('route_name',currentValue)}
                            />
							{errors.route_name && <InputError message={errors.route_name} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="role">Peran</Label>
							<ComboBox
                                items={props.roles}
                                selectedItem={data.role}
                                onSelect={(currentValue)=>setData('role',currentValue)}
                            />
							{errors.role && <InputError message={errors.role} />}
						</div>

						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="permission">Izin</Label>
							<ComboBox
                                items={props.permissions}
                                selectedItem={data.permission}
                                onSelect={(currentValue)=>setData('permission',currentValue)}
                            />
							{errors.permission && <InputError message={errors.permission} />}
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
