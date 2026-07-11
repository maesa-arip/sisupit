import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/Components/ui/alert-dialog';
import { Button } from '@/Components/ui/button';
import { GEO_OPTIONS } from '@/lib/utils';
import axios from 'axios';
import { HeartHandshake, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function HelpConfirmAlertDialog({ reportId, isAlreadyHelping = false, onSuccess, className }) {
	const [loading, setLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [hasHelped, setHasHelped] = useState(isAlreadyHelping);

	const handleConfirm = (e) => {
		e.preventDefault();
		setLoading(true);

		if (!navigator.geolocation) {
			toast.error('Browser Anda tidak mendukung lokasi.');
			setLoading(false);
			return;
		}

		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				try {
					await axios.post(route('front.helpers.store'), {
						report_id: reportId,
						location_lat: pos.coords.latitude,
						location_lng: pos.coords.longitude,
					});

					toast.success('Berhasil! Terima kasih atas bantuan Anda.');
					setHasHelped(true);
					setIsOpen(false);
					if (onSuccess) {
						onSuccess();
					}
				} catch (error) {
					if (error.response?.status === 409) {
						toast.warning('Anda sudah terdaftar sebagai relawan di kejadian ini.');
						setHasHelped(true);
						setIsOpen(false);
					} else {
						toast.error('Gagal mengirim data relawan.');
					}
				} finally {
					setLoading(false);
				}
			},
			(err) => {
				toast.error('Gagal mendapatkan lokasi: ' + err.message);
				setLoading(false);
			},
			GEO_OPTIONS.oneShot,
		);
	};

	// Status jika sudah membantu (Menuju Lokasi)
	if (hasHelped) {
		return (
			<div className="flex h-10 w-full cursor-default items-center justify-center gap-2.5 rounded-md border border-success/20 bg-success/10 px-4 text-success transition-colors">
				{/* Animasi Titik Berdenyut (Pulse Dot) */}
				<div className="relative flex h-2.5 w-2.5 items-center justify-center">
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
					<span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
				</div>

				<span className="text-sm font-semibold tracking-wide">Status: Menuju Lokasi</span>
			</div>
		);
	}

	// Tombol pemicu Dialog (Belum membantu)
	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>
				<Button
					className={`flex h-10 w-full items-center gap-2 rounded-md bg-destructive font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50 ${className}`}
				>
					<HeartHandshake className="h-4 w-4" />
					Saya Akan Bantu
				</Button>
			</AlertDialogTrigger>

			<AlertDialogContent className="rounded-xl border-border bg-card shadow-sm">
				<AlertDialogHeader>
					<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md border border-destructive/20 bg-destructive/10">
						<HeartHandshake className="h-6 w-6 text-destructive" />
					</div>
					<AlertDialogTitle className="text-center text-lg font-semibold text-foreground">
						Konfirmasi Bantuan
					</AlertDialogTitle>
					<AlertDialogDescription className="mt-1.5 text-center text-sm text-muted-foreground">
						Dengan melanjutkan, lokasi terkini Anda akan dibagikan ke sistem agar petugas mengetahui posisi
						Anda. Pastikan Anda menuju lokasi dengan aman.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter className="mt-6 flex gap-2 sm:justify-center">
					<AlertDialogCancel
						disabled={loading}
						className="h-9 w-full rounded-md border border-border bg-card font-medium text-foreground hover:bg-accent sm:w-auto"
					>
						Batal
					</AlertDialogCancel>

					<AlertDialogAction
						onClick={handleConfirm}
						disabled={loading}
						className="h-9 w-full rounded-md bg-destructive font-medium text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50 sm:w-auto"
					>
						{loading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Memproses...
							</>
						) : (
							'Ya, Saya Bantu'
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
