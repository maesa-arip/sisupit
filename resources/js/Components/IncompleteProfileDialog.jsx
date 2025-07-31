// components/IncompleteProfileDialog.jsx
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogAction
} from '@/components/ui/alert-dialog';

export default function IncompleteProfileDialog({ open, onConfirm }) {
	return (
		<AlertDialog open={open}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Profil Belum Lengkap</AlertDialogTitle>
					<AlertDialogDescription>
						Silakan lengkapi profil Anda terlebih dahulu dengan mengisi nomor HP dan foto KTP.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogAction onClick={onConfirm}>Isi Sekarang</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
