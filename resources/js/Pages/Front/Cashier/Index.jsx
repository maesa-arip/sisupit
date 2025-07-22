import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import UseFilter from '@/hooks/UseFilter';
import AppLayout from '@/Layouts/AppLayout';
import { formatToRupiah } from '@/lib/utils';
import { IconCash } from '@tabler/icons-react';
import { Minus, Plus, Search, Tag, Trash2, Utensils } from 'lucide-react';
import { useState } from 'react';

export default function Index(props) {
	// const { data: categories, meta } = props.categories;
	const [params, setParams] = useState(props.state);
	// console.log(books);

	const onSortable = (field) => {
		setParams({
			...params,
			field: field,
			direction: params.direction === 'asc' ? 'desc' : 'asc',
		});
	};
	UseFilter({
		route: route('front.books.index'),
		values: params,
		only: ['categories'],
	});
	const [open, setOpen] = useState(false);
	const [date, setDate] = useState();

	const { toast } = useToast();

	const dummyProducts = [
		{
			id: '1',
			name: 'Kopi Hitam',
			price: 15000,
			category: 'Minuman',
			// image: 'https://images.unsplash.com/photo-1594060445139-717b4b8b3a37',
		},
		{
			id: '2',
			name: 'Cappuccino',
			price: 25000,
			category: 'Minuman',
			// image: 'https://images.unsplash.com/photo-1534778101976-62847782c213',
		},
		{
			id: '3',
			name: 'Latte',
			price: 28000,
			category: 'Minuman',
			// image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f',
		},
		{
			id: '4',
			name: 'Espresso',
			price: 18000,
			category: 'Minuman',
			// image: 'https://images.unsplash.com/photo-1610889556528-9a770e32642f',
		},
		{
			id: '5',
			name: 'Croissant',
			price: 22000,
			category: 'Makanan',
			// image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a',
		},
		{
			id: '6',
			name: 'Sandwich',
			price: 35000,
			category: 'Makanan',
			// image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af',
		},
		{
			id: '7',
			name: 'Donat',
			price: 12000,
			category: 'Makanan',
			// image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b',
		},
		{
			id: '8',
			name: 'Cheese Cake',
			price: 30000,
			category: 'Makanan',
			// image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187',
		},
		{
			id: '9',
			name: 'Brownies',
			price: 25000,
			category: 'Makanan',
			// image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c',
		},
		{
			id: '10',
			name: 'Teh',
			price: 12000,
			category: 'Minuman',
			// image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3',
		},
		{
			id: '11',
			name: 'Jus Jeruk',
			price: 20000,
			category: 'Minuman',
			// image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba',
		},
		{
			id: '12',
			name: 'Roti Bakar',
			price: 18000,
			category: 'Makanan',
			// image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929',
		},
	];

	const dummyDiscounts = [
		{
			id: '1',
			name: 'Diskon Akhir Bulan',
			code: 'ENDMONTH25',
			type: 'percentage',
			value: 25,
			minPurchase: 100000,
			isActive: true,
			applicableTo: 'all',
		},
		{
			id: '2',
			name: 'Promo Minuman',
			code: 'DRINK20',
			type: 'percentage',
			value: 20,
			minPurchase: 50000,
			isActive: true,
			applicableTo: 'category',
			categoryOrProductId: 'Minuman',
		},
		{
			id: '3',
			name: 'Diskon Tetap',
			code: 'FLAT30K',
			type: 'fixed',
			value: 30000,
			minPurchase: 150000,
			isActive: true,
			applicableTo: 'all',
		},
	];

	const dummyTables = [
		{ id: '1', number: 1, capacity: 2, status: 'available', area: 'indoor' },
		{ id: '2', number: 2, capacity: 4, status: 'available', area: 'indoor' },
		{ id: '3', number: 3, capacity: 4, status: 'occupied', area: 'indoor' },
		{ id: '4', number: 4, capacity: 6, status: 'available', area: 'indoor' },
		{ id: '5', number: 5, capacity: 2, status: 'available', area: 'outdoor' },
		{ id: '6', number: 6, capacity: 2, status: 'occupied', area: 'outdoor' },
		{ id: '7', number: 7, capacity: 4, status: 'available', area: 'outdoor' },
		{ id: '8', number: 8, capacity: 8, status: 'available', area: 'vip' },
	];

	const [products, setProducts] = useState(dummyProducts);
	const [cart, setCart] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [activeCategory, setActiveCategory] = useState('Semua');
	const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
	const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
	const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
	const [cashAmount, setCashAmount] = useState('');
	const [discountCode, setDiscountCode] = useState('');
	const [appliedDiscount, setAppliedDiscount] = useState(null);
	const [discountError, setDiscountError] = useState('');
	const [orderType, setOrderType] = useState('takeaway');
	const [selectedTable, setSelectedTable] = useState(null);
	const [tables, setTables] = useState(dummyTables);
	const [customerName, setCustomerName] = useState('');

	// Filter produk berdasarkan kategori dan pencarian
	const filteredProducts = products.filter((product) => {
		const matchesCategory = activeCategory === 'Semua' || product.category === activeCategory;
		const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
		return matchesCategory && matchesSearch;
	});

	// Mendapatkan kategori unik
	const categories = ['Semua', ...Array.from(new Set(products.map((product) => product.category)))];

	const filterProducts = () => {
		return products.filter((product) => {
			const matchesCategory = activeCategory === 'Semua' || product.category === activeCategory;
			const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
			return matchesCategory && matchesSearch;
		});
	};

	const addToCart = (product) => {
		const existing = cart.find((item) => item.id === product.id);
		if (existing) {
			setCart(cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)));
		} else {
			setCart([...cart, { ...product, quantity: 1 }]);
		}
	};

	const removeFromCart = (productId) => {
		setCart(cart.filter((item) => item.id !== productId));
	};

	const changeQuantity = (productId, delta) => {
		setCart(
			cart
				.map((item) => (item.id === productId ? { ...item, quantity: item.quantity + delta } : item))
				.filter((item) => item.quantity > 0),
		);
	};

	const clearCart = () => {
		setCart([]);
		setAppliedDiscount(null);
		setDiscountCode('');
		setCashAmount('');
	};

	const calculateSubtotal = () => {
		return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
	};

	const applyDiscount = () => {
		const discount = dummyDiscounts.find((d) => d.code === discountCode && d.isActive);
		if (!discount) {
			setDiscountError('Kode diskon tidak valid atau tidak aktif');
			setAppliedDiscount(null);
			return;
		}

		const subtotal = calculateSubtotal();
		if (subtotal < discount.minPurchase) {
			setDiscountError(`Minimal pembelian Rp${discount.minPurchase.toLocaleString()}`);
			setAppliedDiscount(null);
			return;
		}

		setAppliedDiscount(discount);
		setDiscountError('');
	};

	const calculateDiscount = () => {
		if (!appliedDiscount) return 0;
		const subtotal = calculateSubtotal();
		if (appliedDiscount.type === 'percentage') {
			return (appliedDiscount.value / 100) * subtotal;
		} else if (appliedDiscount.type === 'fixed') {
			return appliedDiscount.value;
		}
		return 0;
	};

	const calculateTotal = () => {
		return calculateSubtotal() - calculateDiscount();
	};

	const calculateChange = () => {
		const total = calculateTotal();
		const cash = parseFloat(cashAmount);
		return isNaN(cash) ? 0 : Math.max(0, cash - total);
	};
	// console.log(cashAmount)

	const handlePayment = () => {
		const total = calculateTotal();
		const cash = parseFloat(cashAmount);
		if (isNaN(cash) || cash < total) {
			toast({ title: 'Pembayaran gagal', description: 'Uang tunai kurang dari total' });
			return;
		}

		toast({ title: 'Pembayaran sukses', description: `Kembalian: Rp${calculateChange().toLocaleString()}` });
		clearCart();
		setIsPaymentDialogOpen(false);
	};

	// Memulai proses pembayaran
	const startPayment = () => {
		if (orderType === 'dinein' && !selectedTable) {
			setIsTableDialogOpen(true);
		} else {
			setIsPaymentDialogOpen(true);
		}
	};

	const handleCashAmountChange = (e) => {
		const value = e.target.value.replace(/[^\d]/g, '');
		setCashAmount(value ? formatToRupiah(parseInt(value)) : '');
	};

	  // Menyelesaikan transaksi
  const completeTransaction = () => {
    // Jika dine in, update status meja menjadi occupied
    if (orderType === "dinein" && selectedTable) {
      setTables(
        tables.map((table) =>
          table.id === selectedTable.id
            ? { ...table, status: "occupied"}
            : table
        )
      );
    }
    toast({
      title: "Transaksi berhasil!",
      description: `${
        orderType === "dinein"
          ? `Meja ${selectedTable?.number} telah dipesan.`
          : ""
      }`,
    });
    // Di sini bisa ditambahkan logika untuk menyimpan transaksi ke database

    setCart([]);
    setCashAmount("");
    setAppliedDiscount(null);
    setDiscountCode("");
    setOrderType("takeaway");
    setSelectedTable(null);
    setCustomerName("");
    setIsPaymentDialogOpen(false);
  };

	return (
		<div className="flex flex-col w-full space-y-4">
			<div className="flex flex-col items-start justify-between lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconCash}
				/>
			</div>
			<div className="box-content">
				{/* <div className="flex gap-4">
					<div className="flex flex-col gap-3">
						<Label htmlFor="date-picker" className="px-1">
							Date
						</Label>
						<Popover open={open} onOpenChange={setOpen}>
							<PopoverTrigger asChild>
								<Button variant="outline" id="date-picker" className="justify-between w-32 font-normal">
									{date ? date.toLocaleDateString() : 'Select date'}
									<ChevronDownIcon />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0 overflow-hidden" align="start">
								<Calendar
									mode="single"
									selected={date}
									captionLayout="dropdown"
									onSelect={(date) => {
										setDate(date);
										setOpen(false);
									}}
								/>
							</PopoverContent>
						</Popover>
					</div>
					<div className="flex flex-col gap-3">
						<Label htmlFor="time-picker" className="px-1">
							Time
						</Label>
						<Input
							type="time"
							id="time-picker"
							step="1"
							defaultValue="10:30:00"
							className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
						/>
					</div>
				</div> */}
				<div className="flex flex-col">
					<header className="sticky top-0 z-10 flex items-center px-0 border-b"></header>
					<div className="flex flex-col flex-1 md:flex-row">
						{/* Bagian produk */}
						<div className="flex-1 py-4 pr-4">
							<div className="flex items-center justify-between mb-4">
								<div className="relative w-full max-w-sm">
									<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										type="search"
										placeholder="Cari produk..."
										className="w-full pl-8"
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
								</div>
							</div>

							<Tabs
								defaultValue="Semua"
								value={activeCategory}
								onValueChange={setActiveCategory}
								className="mb-4"
							>
								<TabsList className="flex flex-wrap h-auto mb-4">
									{categories.map((category) => (
										<TabsTrigger key={category} value={category} className="mb-1">
											{category}
										</TabsTrigger>
									))}
								</TabsList>
								<TabsContent value={activeCategory} className="mt-0">
									<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
										{filteredProducts.map((product) => (
											<Card key={product.id} className="overflow-hidden">
												<div className="relative aspect-square">
													<img
														src={product.image || '/placeholder.svg?height=200&width=200'}
														alt={product.name}
														className="object-cover w-full h-full"
													/>
												</div>
												<CardHeader className="p-4">
													<CardTitle className="text-base">{product.name}</CardTitle>
													<CardDescription>{formatToRupiah(product.price)}</CardDescription>
												</CardHeader>
												<CardFooter className="flex justify-between p-4 pt-0">
													<Button size="sm" onClick={() => addToCart(product)}>
														<Plus className="w-4 h-4 mr-2" />
														Tambah
													</Button>
												</CardFooter>
											</Card>
										))}
									</div>
								</TabsContent>
							</Tabs>
						</div>

						{/* Bagian keranjang */}
						<div className="w-full border-t md:w-[350px] md:border-l md:border-t-0">
							<Card className="h-full border-0 rounded-none">
								<CardHeader className="px-6 py-4">
									<CardTitle className="text-xl">Keranjang</CardTitle>
									<div className="flex items-center mt-2 space-x-2">
										<RadioGroup
											defaultValue="takeaway"
											value={orderType}
											onValueChange={(value) => setOrderType('takeaway' | 'dinein')}
											className="flex space-x-2"
										>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value="takeaway" id="takeaway" />
												<Label htmlFor="takeaway">Take Away</Label>
											</div>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value="dinein" id="dinein" />
												<Label htmlFor="dinein">Dine In</Label>
											</div>
										</RadioGroup>
									</div>
									{orderType === 'dinein' && selectedTable && (
										<div className="mt-2">
											<Badge variant="outline" className="flex items-center gap-1">
												<Utensils className="w-3 h-3" />
												Meja {selectedTable.number} ({selectedTable.area})
											</Badge>
										</div>
									)}
								</CardHeader>
								<CardContent className="p-0">
									{cart.length === 0 ? (
										<div className="flex h-[300px] flex-col items-center justify-center p-6 text-center">
											<p className="text-muted-foreground">Keranjang belanja kosong</p>
										</div>
									) : (
										<ScrollArea className="h-[calc(100vh-350px)] md:h-[calc(100vh-300px)]">
											<div className="px-6 py-2 space-y-4">
												{cart.map((item) => (
													<div key={item.id} className="flex items-center justify-between">
														<div className="flex items-center gap-3">
															<div className="w-12 h-12 overflow-hidden rounded-md">
																<img
																	src={
																		item.image ||
																		'/placeholder.svg?height=48&width=48'
																	}
																	alt={item.name}
																	className="object-cover w-full h-full"
																/>
															</div>
															<div className="flex-1">
																<h3 className="font-medium">{item.name}</h3>
																<p className="text-sm text-muted-foreground">
																	{formatToRupiah(item.price)}
																</p>
															</div>
														</div>
														<div className="flex items-center gap-2">
															<Button
																variant="outline"
																size="icon"
																onClick={() => decreaseQuantity(item.id)}
															>
																<Minus className="w-3 h-3" />
															</Button>
															<span className="w-8 text-center">{item.quantity}</span>
															<Button
																variant="outline"
																size="icon"
																onClick={() => addToCart(item)}
															>
																<Plus className="w-3 h-3" />
															</Button>
															<Button
																variant="ghost"
																size="icon"
																onClick={() => removeFromCart(item.id)}
															>
																<Trash2 className="w-4 h-4 text-muted-foreground" />
															</Button>
														</div>
													</div>
												))}
											</div>
										</ScrollArea>
									)}
								</CardContent>
								<CardFooter className="flex flex-col p-6 border-t">
									<div className="w-full mb-4 space-y-2">
										<div className="flex justify-between">
											<span className="text-muted-foreground">Subtotal</span>
											<span>{formatToRupiah(calculateSubtotal())}</span>
										</div>
										{appliedDiscount && (
											<div className="flex justify-between text-green-600">
												<span className="flex items-center">
													<Tag className="w-4 h-4 mr-1" />
													Diskon ({appliedDiscount.name})
												</span>
												<span>-{formatToRupiah(calculateDiscount())}</span>
											</div>
										)}
										<div className="flex justify-between">
											<span className="text-muted-foreground">Pajak (10%)</span>
											<span>
												{formatToRupiah((calculateSubtotal() - calculateDiscount()) * 0.1)}
											</span>
										</div>
										<Separator className="my-2" />
										<div className="flex justify-between text-lg font-medium">
											<span>Total</span>
											<span>{formatToRupiah(calculateTotal())}</span>
										</div>
									</div>
									<div className="flex w-full gap-2 mb-4">
										<Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
											<DialogTrigger asChild>
												<Button variant="outline" className="flex-1">
													<Tag className="w-4 h-4 mr-2" />
													{appliedDiscount ? 'Ubah Diskon' : 'Tambah Diskon'}
												</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Tambah Diskon</DialogTitle>
													<DialogDescription>
														Masukkan kode diskon untuk mendapatkan potongan harga
													</DialogDescription>
												</DialogHeader>
												<div className="py-4 space-y-4">
													<div className="space-y-2">
														<Label htmlFor="discountCode">Kode Diskon</Label>
														<Input
															id="discountCode"
															placeholder="Masukkan kode diskon"
															value={discountCode}
															onChange={(e) => setDiscountCode(e.target.value)}
														/>
														{discountError && (
															<p className="text-sm text-red-500">{discountError}</p>
														)}
													</div>
												</div>
												<DialogFooter>
													<Button
														variant="outline"
														onClick={() => setIsDiscountDialogOpen(false)}
													>
														Batal
													</Button>
													<Button onClick={applyDiscount}>Terapkan</Button>
												</DialogFooter>
											</DialogContent>
										</Dialog>
										<Button
											className="flex-1"
											size="md"
											disabled={cart.length === 0}
											onClick={startPayment}
										>
											Bayar
										</Button>
									</div>
								</CardFooter>
							</Card>
						</div>
					</div>

					{/* Dialog Pilih Meja */}
					<Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
						<DialogContent className="max-w-3xl">
							<DialogHeader>
								<DialogTitle>Pilih Meja</DialogTitle>
								<DialogDescription>Pilih meja yang tersedia untuk pelanggan dine in</DialogDescription>
							</DialogHeader>
							<div className="py-4">
								<div className="mb-4">
									<Label htmlFor="customerName">Nama Pelanggan</Label>
									<Input
										id="customerName"
										placeholder="Masukkan nama pelanggan"
										value={customerName}
										onChange={(e) => setCustomerName(e.target.value)}
										className="mt-1"
									/>
								</div>
								<Tabs defaultValue="indoor">
									<TabsList>
										<TabsTrigger value="indoor">Indoor</TabsTrigger>
										<TabsTrigger value="outdoor">Outdoor</TabsTrigger>
										<TabsTrigger value="vip">VIP</TabsTrigger>
									</TabsList>
									{['indoor', 'outdoor', 'vip'].map((area) => (
										<TabsContent key={area} value={area} className="mt-4">
											<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
												{tables
													.filter((table) => table.area === area)
													.map((table) => (
														<Card
															key={table.id}
															className={`cursor-pointer transition-all ${
																table.status === 'available'
																	? selectedTable?.id === table.id
																		? 'border-2 border-primary'
																		: 'hover:border-primary'
																	: 'cursor-not-allowed opacity-50'
															}`}
															onClick={() =>
																table.status === 'available' && selectTable(table)
															}
														>
															<CardHeader className="p-4">
																<CardTitle className="text-lg">
																	Meja {table.number}
																</CardTitle>
																<CardDescription>
																	Kapasitas: {table.capacity} orang
																	<Badge
																		className={`ml-2 ${
																			table.status === 'available'
																				? 'bg-green-100 text-green-800'
																				: table.status === 'occupied'
																					? 'bg-red-100 text-red-800'
																					: 'bg-yellow-100 text-yellow-800'
																		}`}
																	>
																		{table.status === 'available'
																			? 'Tersedia'
																			: table.status === 'occupied'
																				? 'Terisi'
																				: 'Dipesan'}
																	</Badge>
																</CardDescription>
															</CardHeader>
														</Card>
													))}
											</div>
										</TabsContent>
									))}
								</Tabs>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setIsTableDialogOpen(false)}>
									Batal
								</Button>
								<Button
									onClick={() => {
										setIsTableDialogOpen(false);
										setIsPaymentDialogOpen(true);
									}}
									disabled={!selectedTable || !customerName}
								>
									Konfirmasi Meja
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					{/* Dialog Pembayaran */}
					<Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Pembayaran</DialogTitle>
								<DialogDescription>
									{orderType === 'dinein' && selectedTable
										? `Pembayaran untuk Meja ${selectedTable.number} (${customerName})`
										: 'Masukkan jumlah uang yang diterima dari pelanggan'}
								</DialogDescription>
							</DialogHeader>
							<div className="py-4 space-y-4">
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>Total Belanja:</span>
										<span className="font-medium">{formatToRupiah(calculateTotal())}</span>
									</div>
								</div>
								<div className="space-y-2">
									<label
										htmlFor="cash"
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Uang Tunai
									</label>
									<Input
										id="cash"
										placeholder="Rp 0"
										value={cashAmount}
										onChange={handleCashAmountChange}
									/>
								</div>
								{cashAmount && (
									<div className="space-y-2">
										<div className="flex justify-between text-sm">
											<span>Kembalian:</span>
											<span className="font-medium">{formatToRupiah(calculateChange())}</span>
										</div>
									</div>
								)}
							</div>
							<DialogFooter>
								<Button
									  onClick={completeTransaction}
									disabled={
										!cashAmount ||
										Number.parseFloat(cashAmount.replace(/[^\d]/g, '')) < calculateTotal()
									}
								>
									Selesaikan Transaksi
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
				<div className="flex flex-col gap-8 mb-24 lg:grid lg:grid-cols-4">
					{/* {categories.map((category, index) => (
						<CategoryCard key={index} item={category} />
					))} */}
				</div>
				<div className="overflow-x-auto">
					{/* {meta.has_pages && (
						<Pagination>
							<PaginationContent className="flex justify-center fles-wrap lg:justify-end">
								{meta.links.map((link, index) => (
									<PaginationItem key={index} className="mx-1 mb-1 lg:mb-0">
										<PaginationLink href={link.url} isActive={link.active}>
											{link.label}
										</PaginationLink>
									</PaginationItem>
								))}
							</PaginationContent>
						</Pagination>
					)} */}
				</div>
			</div>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
