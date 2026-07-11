import { Button } from '@/Components/ui/button';
import { router } from '@inertiajs/react';
import { IconCheck, IconHeartHandshake, IconLoader2 } from '@tabler/icons-react';
import { useState } from 'react';

export default function VolunteerAction({ incidentId, alreadyHelping = false }) {
	// State untuk menangani proses loading dan perubahan status
	const [isHelping, setIsHelping] = useState(alreadyHelping);
	const [isLoading, setIsLoading] = useState(false);

	const handleVolunteerAction = () => {
		setIsLoading(true);

		// Mengirim data ke backend Laravel bahwa user ini bersedia membantu
		router.post(
			route('front.helpers.store', incidentId),
			{},
			{
				preserveScroll: true,
				preserveState: true,
				onSuccess: () => {
					setIsHelping(true);
					setIsLoading(false);
				},
				onError: () => {
					alert('Gagal memproses permintaan. Silakan coba lagi.');
					setIsLoading(false);
				},
			},
		);
	};

	return (
		<div className="mt-4 w-full">
			{!isHelping ? (
				// Tombol "Saya Akan Bantu" (Warna utama / Amber)
				<Button
					onClick={handleVolunteerAction}
					disabled={isLoading}
					className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-warning text-warning-foreground shadow-md transition-all hover:-translate-y-0.5 hover:bg-warning/90 hover:shadow-lg active:translate-y-0"
				>
					{isLoading ? (
						<IconLoader2 className="h-5 w-5 animate-spin" />
					) : (
						<IconHeartHandshake className="h-5 w-5" />
					)}
					<span className="font-bold tracking-wide">Saya Akan Bantu</span>
				</Button>
			) : (
				// Tampilan setelah diklik (Berubah menjadi Hijau/Sukses)
				<div className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-success/20 bg-success/10 text-success">
					<IconCheck className="h-5 w-5" />
					<span className="font-bold">Anda Sedang Menuju Lokasi</span>
				</div>
			)}
		</div>
	);
}
