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
import { HeartHandshake, Loader2 } from "lucide-react"; 

export default function HelpConfirmAlertDialog({ reportId, isAlreadyHelping = false, onSuccess, className }) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasHelped, setHasHelped] = useState(isAlreadyHelping);

  const handleConfirm = (e) => {
    e.preventDefault();
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
          setHasHelped(true);
          setIsOpen(false);
          if (onSuccess) {
            onSuccess();
          }
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

  // Status jika sudah membantu (Menuju Lokasi)
  if (hasHelped) {
      return (
          <div className="flex items-center justify-center w-full h-10 gap-2.5 px-4 text-green-700 dark:text-success bg-green-50 dark:bg-success/10 border border-green-200 dark:border-success/20 rounded-md transition-colors cursor-default">
              {/* Animasi Titik Berdenyut (Pulse Dot) */}
              <div className="relative flex items-center justify-center w-2.5 h-2.5">
                  <span className="absolute inline-flex w-full h-full bg-green-500 dark:bg-success rounded-full opacity-75 animate-ping"></span>
                  <span className="relative inline-flex w-2 h-2 bg-green-600 dark:bg-success rounded-full"></span>
              </div>

              <span className="text-sm font-semibold tracking-wide">Status: Menuju Lokasi</span>
          </div>
      );
  }

  // Tombol pemicu Dialog (Belum membantu)
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button className={`flex items-center gap-2 font-medium w-full h-10 rounded-md bg-destructive hover:bg-destructive/90 text-destructive-foreground focus-visible:ring-2 focus-visible:ring-destructive/50 transition-colors ${className}`}>
            <HeartHandshake className="w-4 h-4" />
            Saya Akan Bantu
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="rounded-xl border-border bg-card shadow-sm">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mx-auto mb-3 rounded-md w-12 h-12 bg-destructive/10 border border-destructive/20">
            <HeartHandshake className="w-6 h-6 text-destructive" />
          </div>
          <AlertDialogTitle className="text-lg font-semibold text-center text-foreground">Konfirmasi Bantuan</AlertDialogTitle>
          <AlertDialogDescription className="mt-1.5 text-sm text-center text-muted-foreground">
            Dengan melanjutkan, lokasi terkini Anda akan dibagikan ke sistem agar petugas mengetahui posisi Anda. Pastikan Anda menuju lokasi dengan aman.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex gap-2 mt-6 sm:justify-center">
          <AlertDialogCancel
            disabled={loading}
            className="w-full sm:w-auto h-9 font-medium text-foreground bg-card border border-border rounded-md hover:bg-accent"
          >
              Batal
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:w-auto h-9 font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md focus-visible:ring-2 focus-visible:ring-destructive/50"
          >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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