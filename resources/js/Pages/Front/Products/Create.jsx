import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage, formatToRupiah } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconBrandProducthunt } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export default function Create(props) {
	const fileInputLogo = useRef(null);
	const { data, setData, reset, post, processing, errors } = useForm({
		company_id: null,
		category_id: null,
		unit_id: null,
		name: '',
		sku: '',
		price: '',
		cost: '',
		profit: '',
		stock: '',
		min_stock: '',
		logo: null,
		_method: props.page_settings.method,
	});
	const onHandleChange = (e) => setData(e.target.name, e.target.value);

	 const [formattedEditPrice, setFormattedEditPrice] = useState("");
	const handleEditPriceChange = (e) => {
		const value = e.target.value.replace(/[^\d]/g, '');
		setFormattedEditPrice(value ? formatToRupiah(parseInt(value)) : '');
		setData(e.target.name, parseInt(value) || 0);
		//   setCurrentProduct({
		//     ...currentProduct,
		//     price: parseInt(value) || 0,
		//   });
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
		fileInputLogo.current.value = null;
	};
	// console.log(data)
	return (
		<div className="flex flex-col w-full pb-32">
			<div className="flex flex-col items-start justify-between mb-8 gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconBrandProducthunt}
				/>
				<Button variant="orange" size="sm" asChild>
					<Link href={route('front.products.index')}>
						<IconArrowLeft className="size-4" />
						Kembali
					</Link>
				</Button>
			</div>
			<Card>
				<CardContent className="p-6">
					<form className="space-y-6" onSubmit={onHandleSubmit}>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="sku">SKU</Label>
							<Input
								name="sku"
								id="sku"
								value={data.sku}
								type="text"
								onChange={onHandleChange}
							/>
							{errors.sku && <InputError message={errors.sku} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="name">Nama</Label>
							<Input
								name="name"
								id="name"
								value={data.name}
								type="text"
								onChange={onHandleChange}
							/>
							{errors.name && <InputError message={errors.name} />}
						</div>

						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="image">Gambar</Label>
							<Input
								name="image"
								id="image"
								type="file"
								ref={fileInputLogo}
								onChange={(e) => setData(e.target.name, e.target.files[0])}
							/>
							{errors.image && <InputError message={errors.image} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="price">Harga</Label>
							<Input
								name="price"
								id="price"
								placeholder="Rp 0"
								value={formattedEditPrice}
								onChange={handleEditPriceChange}
							/>
							{errors.price && <InputError message={errors.price} />}
						</div>

						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="category_id">Kategori</Label>
							<Select
								defaultValue={data.category_id}
								onValueChange={(value) => setData('category_id', value)}
							>
								<SelectTrigger>
									<SelectValue>
										{props.page_data.categories.find(
											(category) => category.value == data.category_id,
										)?.label ?? 'Pilih Kategori'}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{props.page_data.categories.map((category, index) => (
										<SelectItem key={index} value={category.value}>
											{category.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.category_id && <InputError message={errors.category_id} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="unit_id">Satuan</Label>
							<Select defaultValue={data.unit_id} onValueChange={(value) => setData('unit_id', value)}>
								<SelectTrigger>
									<SelectValue>
										{props.page_data.units.find((unit) => unit.value == data.unit_id)?.label ??
											'Pilih Penerbit'}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{props.page_data.units.map((unit, index) => (
										<SelectItem key={index} value={unit.value}>
											{unit.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.unit_id && <InputError message={errors.unit_id} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="min_stock">Minimal Stok</Label>
							<Input
								name="min_stock"
								id="min_stock"
								value={data.min_stock}
								type="number"
								placeholder='0'
								onChange={onHandleChange}
							/>
							{errors.min_stock && <InputError message={errors.min_stock} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="stock">Total Stok</Label>
							<Input
								name="stock"
								id="stock"
								value={data.stock}
								type="number"
								placeholder='0'
								onChange={onHandleChange}
							/>
							{errors.stock && <InputError message={errors.stock} />}
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
