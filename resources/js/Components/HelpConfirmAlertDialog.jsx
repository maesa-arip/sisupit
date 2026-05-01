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
// Tambahkan Loader2 dan CheckCircle2
import { HeartHandshake, Loader2, CheckCircle2 } from "lucide-react"; 

export default function HelpConfirmAlertDialog({ reportId, isAlreadyHelping = false, onSuccess, className }) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Kontrol manual untuk buka/tutup dialog
  const [hasHelped, setHasHelped] = useState(isAlreadyHelping); // State lokal untuk ubah tombol ke mode Sukses

  const handleConfirm = (e) => {
    e.preventDefault(); // PENTING: Cegah dialog tertutup otomatis saat diklik
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
          setHasHelped(true); // Ubah tombol menjadi warna hijau
          setIsOpen(false);   // Tutup dialog setelah sukses
          onSuccess?.();
        } catch (error) {
          if (error.response?.status === 409) {
            toast.warning("Anda sudah terdaftar sebagai relawan di kejadian ini.");
            setHasHelped(true);
            setIsOpen(false);
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

  // Jika statusnya sudah membantu, tampilkan indikator status misi aktif
  if (hasHelped) {
      return (
          <div className="flex items-center justify-center w-full h-12 gap-2.5 px-4 text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-sm rounded-xl dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50 hover:bg-emerald-100 hover:border-emerald-300 dark:hover:bg-emerald-900/50 transition-all cursor-default">
              
              {/* Animasi Titik Berdenyut (Pulse Dot) yang Elegan */}
              <div className="relative flex items-center justify-center w-3 h-3">
                  <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-emerald-500 dark:bg-emerald-400"></span>
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500"></span>
              </div>
              
              <span className="text-[14px] font-bold tracking-wide">Status: Menuju Lokasi</span>
          </div>
      );
  }


  // Jika belum membantu, tampilkan tombol pemicu Dialog
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {/* Tambahkan ikon kecil di tombol utama agar lebih manis */}
        <Button className={`flex items-center gap-2 font-bold w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white ${className}`}>
            <HeartHandshake className="w-5 h-5" />
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
          {/* Matikan tombol batal jika sedang loading */}
          <AlertDialogCancel disabled={loading} className="w-full font-bold border-gray-300 sm:w-auto rounded-xl dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 h-11">
              Batal
          </AlertDialogCancel>
          
          <AlertDialogAction 
            onClick={handleConfirm} 
            disabled={loading}
            className="w-full font-bold text-white sm:w-auto rounded-xl bg-amber-600 hover:bg-amber-700 h-11"
          >
            {/* Animasi Loading */}
            {loading ? (
                <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Memproses...
                </>
            ) : (
                "Ya, Saya Bantu"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}