import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/Components/ui/alert-dialog';
import { GEO_ACCURACY_THRESHOLD, GEO_OPTIONS } from '@/lib/utils';
import { IconCurrentLocation, IconLoader2 } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Tawaran "pakai lokasi saat ini" saat admin membuka form pendataan fasilitas (TASK_30).
 *
 * Dipakai ketiga form Tambah aset: Hydrant, SKKL, dan Pos Pemadam — ketiganya merangkai
 * Leaflet-nya sendiri, jadi dialog ini sengaja TIDAK menyentuh komponen peta apa pun dan
 * hanya melapor koordinat ke parent lewat `onUse`.
 *
 * Kenapa dialog, bukan GPS otomatis: pendataan aset umumnya dilakukan petugas yang berdiri
 * persis di titik yang didata, tapi tidak selalu — kadang diinput dari kantor berdasarkan
 * catatan survei. Menembak GPS diam-diam (perilaku lama <UserLeafletMap autoLocate>) membuat
 * pin melompat ke kantor tanpa ada yang meminta, dan sulit disadari karena tak ada jejaknya.
 *
 * CATATAN: form lapor darurat warga & form lapor Pusat Komando sengaja TIDAK memakai dialog
 * ini. Di sana GPS otomatis memang perilaku yang benar (darurat-first), dan satu ketukan
 * tambahan saat panik adalah biaya yang tak boleh ditambahkan.
 */
export default function UseCurrentLocationDialog({ onUse, assetLabel = 'aset ini' }) {
	const [open, setOpen] = useState(true);
	const [loading, setLoading] = useState(false);

	const handleUse = (e) => {
		e.preventDefault(); // tahan dialog tetap terbuka selama GPS dicari

		if (!navigator.geolocation) {
			toast.error('Browser Anda tidak mendukung deteksi lokasi.');
			setOpen(false);
			return;
		}

		setLoading(true);
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const { latitude, longitude, accuracy } = position.coords;

				// Fix di atas ambang ini biasanya berbasis jaringan/IP dan bisa meleset
				// puluhan kilometer (gejala "lokasi lari ke kota lain", FINDINGS #34).
				// Koordinatnya tetap dipakai sebagai titik awal, tapi petugas diberi tahu
				// agar memverifikasi pin — bukan dibiarkan mengira itu presisi GPS.
				if (accuracy > GEO_ACCURACY_THRESHOLD) {
					toast.warning(
						`Akurasi lokasi rendah (±${Math.round(accuracy)} m). Periksa & geser pin ke titik ${assetLabel} yang sebenarnya.`,
					);
				} else {
					toast.success('Titik peta dipindahkan ke lokasi Anda saat ini.');
				}

				onUse(latitude, longitude);
				setLoading(false);
				setOpen(false);
			},
			(err) => {
				toast.error('Gagal mendapatkan lokasi: ' + err.message);
				setLoading(false);
				setOpen(false);
			},
			GEO_OPTIONS.oneShot,
		);
	};

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogContent className="rounded-xl border-border bg-card shadow-sm">
				<AlertDialogHeader>
					<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md border border-info/20 bg-info/10">
						<IconCurrentLocation className="h-6 w-6 text-info" />
					</div>
					<AlertDialogTitle className="text-center text-lg font-semibold text-foreground">
						Pakai Lokasi Saat Ini?
					</AlertDialogTitle>
					<AlertDialogDescription className="mt-1.5 text-center text-sm text-muted-foreground">
						Jika Anda sedang berada di titik {assetLabel}, lokasi perangkat Anda bisa langsung dipakai
						sebagai koordinatnya. Pin tetap bisa digeser setelahnya.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter className="mt-6 flex gap-2 sm:justify-center">
					<AlertDialogCancel
						disabled={loading}
						className="h-9 w-full rounded-md border border-border bg-card font-medium text-foreground hover:bg-accent sm:w-auto"
					>
						Nanti Saja
					</AlertDialogCancel>

					<AlertDialogAction
						onClick={handleUse}
						disabled={loading}
						className="h-9 w-full rounded-md bg-info font-medium text-info-foreground hover:bg-info/90 sm:w-auto"
					>
						{loading ? (
							<>
								<IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
								Mencari lokasi...
							</>
						) : (
							'Pakai Lokasi Saya'
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
