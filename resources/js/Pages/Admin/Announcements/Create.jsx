
import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import { IconAlertCircle, IconArrowLeft, IconCategory } from '@tabler/icons-react';
import { useRef } from 'react';
import { toast } from 'sonner';

export default function Create(props) {
    const { data, setData, reset, post, processing, errors } = useForm({
        message: '',
        url: '',
        is_active: false,
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
        <div className="flex flex-col w-full pb-32">
            <div className="flex flex-col items-start justify-between mb-8 gap-y-4 lg:flex-row lg:items-center">
                <HeaderTitle
                    title={props.page_settings.title}
                    subtitle={props.page_settings.subtitle}
                    icon={IconAlertCircle}
                />
                <Button variant="orange" size="sm" asChild>
                    <Link href={route('admin.announcements.index')}>
                        <IconArrowLeft className="size-4" />
                        Kembali
                    </Link>
                </Button>
            </div>
            <Card>
                <CardContent className="p-6">
                    <form className="space-y-6" onSubmit={onHandleSubmit}>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="message">Pesan</Label>
                            <Input
                                name="message"
                                id="message"
                                value={data.message}
                                type="text"
                                placeholder="Masukan pesan..."
                                onChange={onHandleChange}
                            />
                            {errors.message && <InputError message={errors.message} />}
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="url">URL</Label>
                            <Input
                                name="url"
                                id="url"
                                value={data.url}
                                type="text"
                                placeholder="Masukan url..."
                                onChange={onHandleChange}
                            />
                            {errors.url && <InputError message={errors.url} />}
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <div className='flex space-x-2 items-top'>
                                <Checkbox
                                    id='is_active'
                                    name='is_active'
                                    checked={data.is_active}
                                    onCheckedChange={(checked)=>setData('is_active',checked)}
                                />
                                <div className='grid leading-none gap-1/5'>
                                    <Label htmlFor="is_active">
                                        Apakah Aktif
                                    </Label>
                                </div>
                            </div>
                            {errors.is_active && <InputError message={errors.is_active} />}
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
