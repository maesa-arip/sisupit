import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { router } from '@inertiajs/react';
import { 
    IconHeartHandshake, 
    IconCheck, 
    IconLoader2 
} from '@tabler/icons-react';

export default function VolunteerAction({ incidentId, alreadyHelping = false }) {
    // State untuk menangani proses loading dan perubahan status
    const [isHelping, setIsHelping] = useState(alreadyHelping);
    const [isLoading, setIsLoading] = useState(false);

    const handleVolunteerAction = () => {
        setIsLoading(true);

        // Mengirim data ke backend Laravel bahwa user ini bersedia membantu
        router.post(route('front.helpers.store', incidentId), {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setIsHelping(true);
                setIsLoading(false);
            },
            onError: () => {
                alert('Gagal memproses permintaan. Silakan coba lagi.');
                setIsLoading(false);
            }
        });
    };

    return (
        <div className="w-full mt-4">
            {!isHelping ? (
                // Tombol "Saya Akan Bantu" (Warna utama / Amber)
                <Button 
                    onClick={handleVolunteerAction}
                    disabled={isLoading}
                    className="flex items-center justify-center w-full h-11 gap-2 text-white transition-all shadow-md bg-amber-600 hover:bg-amber-700 rounded-xl hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                    {isLoading ? (
                        <IconLoader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <IconHeartHandshake className="w-5 h-5" />
                    )}
                    <span className="font-bold tracking-wide">Saya Akan Bantu</span>
                </Button>
            ) : (
                // Tampilan setelah diklik (Berubah menjadi Hijau/Sukses)
                <div className="flex items-center justify-center w-full gap-2 text-green-800 border-2 border-green-200 h-11 bg-green-50 rounded-xl dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50">
                    <IconCheck className="w-5 h-5" />
                    <span className="font-bold">Anda Sedang Menuju Lokasi</span>
                </div>
            )}
        </div>
    );
}