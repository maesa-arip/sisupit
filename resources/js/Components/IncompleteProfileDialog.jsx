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
            <AlertDialogContent className="rounded-xl border-[#e5e5e5] bg-white shadow-sm dark:bg-[#151515] dark:border-[#262626]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Profil Belum Lengkap
                    </AlertDialogTitle>
                    <AlertDialogDescription className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Silakan lengkapi profil Anda terlebih dahulu dengan mengisi nomor HP dan mengunggah foto KTP agar dapat menggunakan fitur secara maksimal.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                
                <AlertDialogFooter className="mt-4">
                    <AlertDialogAction 
                        onClick={onConfirm}
                        className="h-9 font-medium text-white bg-[#b42826] hover:bg-[#9a2220] rounded-md focus-visible:ring-2 focus-visible:ring-[#b42826]/50 transition-colors"
                    >
                        Isi Sekarang
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}