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

export default function HelpConfirmAlertDialog({ reportId, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = () => {
    console.log(reportId)
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

          toast.success("Berhasil menjadi relawan!");
          onSuccess?.();
        } catch (error) {
          if (error.response?.status === 409) {
            toast.warning("Anda sudah mendaftar sebagai relawan.");
          } else {
            toast.error("Gagal menyimpan data relawan.");
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
        <Button variant="destructive" className="w-full">
          Saya Akan Membantu
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apakah Anda Yakin Ingin Membantu?</AlertDialogTitle>
          <AlertDialogDescription>
            Lokasi Anda akan dikirim ke server untuk membantu petugas melacak posisi Anda
            saat menuju lokasi kejadian. Lanjutkan?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading}>
            {loading ? "Mengirim..." : "Konfirmasi"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
