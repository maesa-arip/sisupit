import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/Components/ui/alert-dialog";
import { HeartHandshake } from "lucide-react";

export default function HelpConfirmAlertDialog({ reportId, onSuccess, className }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = () => {
    setLoading(true);

    if (!navigator.geolocation) {
      toast.error("Browser Anda tidak mendukung lokasi.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await axios.post(route("front.helpers.store"), {
            report_id: reportId,
            location_lat: pos.coords.latitude,
            location_lng: pos.coords.longitude,
          });

          toast.success("Berhasil! Terima kasih atas bantuan Anda.");
          onSuccess?.();
        } catch (error) {
          if (error.response?.status === 409) {
            toast.warning("Anda sudah terdaftar sebagai relawan di kejadian ini.");
          } else {
            toast.error("Gagal mengirim data relawan.");
          }
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        toast.error("Gagal mendapatkan lokasi: " + err.message);
        setLoading(false);
      }
    );
  };

  return (
    <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button className={className}>
                    Saya Akan Bantu
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[28px] dark:bg-slate-900 dark:border-slate-800">
                <AlertDialogHeader>
                    <div className="flex items-center justify-center mx-auto mb-4 rounded-full w-14 h-14 bg-amber-100 dark:bg-amber-500/20">
                        <HeartHandshake className="w-7 h-7 text-amber-600 dark:text-amber-500" />
                    </div>
                    <AlertDialogTitle className="text-xl font-bold text-center dark:text-slate-100">Konfirmasi Bantuan</AlertDialogTitle>
                    <AlertDialogDescription className="mt-2 text-center text-gray-500 dark:text-slate-400">
                        Dengan melanjutkan, lokasi terkini Anda akan dibagikan ke sistem agar petugas mengetahui posisi Anda. Pastikan Anda menuju lokasi dengan aman.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex gap-3 mt-8 sm:justify-center">
                    <AlertDialogCancel className="w-full font-bold border-gray-300 sm:w-auto rounded-xl dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 h-11">Batal</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleConfirm} 
                        disabled={loading}
                        className="w-full font-bold text-white sm:w-auto rounded-xl bg-amber-600 hover:bg-amber-700 h-11"
                    >
                        {loading ? "Memproses..." : "Ya, Saya Bantu"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
  );
}