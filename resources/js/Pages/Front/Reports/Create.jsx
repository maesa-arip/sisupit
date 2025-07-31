import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import UserLeafletMap from '@/Components/UserLeafletMap';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, useForm, usePage } from '@inertiajs/react';
import { IconArrowLeft, IconBuildingCommunity } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function Create(props) {
	const auth = props.auth.user;
	// console.log(auth)
	// const variable array to save the users location
	const [userLocation, setUserLocation] = useState(null);

	// define the function that finds the users geolocation
	const getUserLocation = () => {
		// if geolocation is supported by the users browser
		if (navigator.geolocation) {
			// get the current users location
			navigator.geolocation.getCurrentPosition(
				(position) => {
					// save the geolocation coordinates in two variables
					const { latitude, longitude } = position.coords;
					// update the value of userlocation variable
					setUserLocation({ latitude, longitude });
				},
				// if there was an error getting the users location
				(error) => {
					console.error('Error getting user location:', error);
				},
			);
		}
		// if geolocation is not supported by the users browser
		else {
			console.error('Geolocation is not supported by this browser.');
		}
	};
	useEffect(() => {
	getUserLocation();
}, []);
	useEffect(() => {
		if (userLocation) {
			setData('location_lat', userLocation.latitude);
			setData('location_lng', userLocation.longitude);
		}
	}, [userLocation]);
	const fileInputPhoto = useRef(null);
	const { data, setData, reset, post, processing, errors } = useForm({
		name: '',
		address: '',
		title: '',
		description: '',
		location_lat: '',
		location_lng: '',
		phone: '',
		photo: null,
		_method: props.page_settings.method,
	});
	console.log(data);
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
		fileInputPhoto.current.value = null;
	};

	return (
		<div className="flex flex-col w-full pb-32">
			<div className="flex flex-col items-start justify-between mb-8 gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconBuildingCommunity}
				/>
				<Button variant="orange" size="sm" asChild>
					<Link href={route('dashboard')}>
						<IconArrowLeft className="size-4" />
						Kembali
					</Link>
				</Button>
			</div>

			<Card>
				<CardContent className="p-6">
					<form className="space-y-6" onSubmit={onHandleSubmit}>
						{userLocation && (
							<div>
								<h2>User Location</h2>
								<p>Latitude: {userLocation.latitude}</p>
								<p>Longitude: {userLocation.longitude}</p>
							</div>
						)}
						<UserLeafletMap />
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="location_lat">location_lat</Label>
							<Input
								name="location_lat"
								id="location_lat"
								value={userLocation?.latitude}
								type="text"
								readOnly
							/>
							{errors.location_lat && <InputError message={errors.location_lat} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="location_lng">location_lng</Label>
							<Input
								name="location_lng"
								id="location_lng"
								value={userLocation?.longitude}
								type="text"
								readOnly
							/>
							{errors.location_lng && <InputError message={errors.location_lng} />}
						</div>
						{/* <div className="grid w-full items-center gap-1.5">
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
							<Label htmlFor="phone">Nomor Telp</Label>
							<Input
								name="phone"
								id="phone"
								value={data.phone}
								type="text"
								placeholder="Masukan nomor telp..."
								onChange={onHandleChange}
							/>
							{errors.phone && <InputError message={errors.phone} />}
						</div> */}
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="title">Judul (Kebakaran/Bencana Alam, dll)</Label>
							<Input
								name="title"
								id="title"
								value={data.title}
								type="text"
								placeholder="Masukan keterangan judul laporan..."
								onChange={onHandleChange}
							/>
							{errors.title && <InputError message={errors.title} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="description">Deskrisp(Boleh Kosong)</Label>
							<Textarea
								name="description"
								id="description"
								value={data.description}
								placeholder="Masukan deskripsi kejadian..."
								onChange={onHandleChange}
							/>
							{errors.description && <InputError message={errors.description} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="address">Alamat(Boleh Kosong, akan diambil dari lokasi anda berada)</Label>
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
							<Label htmlFor="photo">Photo</Label>
							<Input
								name="photo"
								id="photo"
								type="file"
								ref={fileInputPhoto}
								onChange={(e) => setData(e.target.name, e.target.files[0])}
							/>
							{errors.photo && <InputError message={errors.photo} />}
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
