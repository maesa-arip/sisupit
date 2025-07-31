import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function DialogRelawanDetail({ open, onClose, helper, onBack }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detail Relawan</DialogTitle>
        </DialogHeader>

        {helper && (
          <div className="mt-2 space-y-2">
            <p><strong>Nama:</strong> {helper.user?.name}</p>
            <p><strong>Email:</strong> {helper.user?.email}</p>
            <p><strong>No HP:</strong> {helper.user?.phone}</p>
            <p><strong>Lokasi:</strong> {helper.location_lat}, {helper.location_lng}</p>
            <p><strong>Bergabung:</strong> {helper.created_at}</p>
          </div>
        )}

        <DialogFooter className="flex justify-between mt-4">
          <Button variant="outline" onClick={onBack}>
            Kembali ke Daftar Relawan
          </Button>
          <Button onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
