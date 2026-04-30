import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Mail, MapPin, Phone, User } from "lucide-react";

export default function DialogRelawanDetail({ open, onClose, helper, onBack }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 overflow-hidden sm:max-w-md rounded-2xl">
        <DialogHeader className="flex flex-row items-center gap-3 px-4 py-4 space-y-0 border-b border-gray-100">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </Button>
          <DialogTitle className="text-lg">Detail Relawan</DialogTitle>
        </DialogHeader>

        {helper && (
          <div className="p-6">
            <div className="flex flex-col items-center mb-6">
               <div className="flex items-center justify-center w-20 h-20 mb-3 text-3xl font-bold rounded-full shadow-inner text-amber-600 bg-amber-100">
                  {helper.user?.name?.[0]?.toUpperCase() ?? '?'}
               </div>
               <h3 className="text-lg font-bold text-gray-900">{helper.user?.name}</h3>
               <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full mt-1 border border-amber-100">
                  Relawan Terdaftar
               </span>
            </div>

            <div className="space-y-3">
              <DetailItem icon={<Mail />} label="Email" value={helper.user?.email} />
              <DetailItem icon={<Phone />} label="No. Handphone" value={helper.user?.phone} />
              <DetailItem 
                icon={<MapPin />} 
                label="Titik Lokasi Bantuan" 
                value={`${helper.location_lat}, ${helper.location_lng}`} 
              />
              <DetailItem icon={<Calendar />} label="Waktu Bergabung" value={helper.created_at} />
            </div>
          </div>
        )}

        <div className="px-6 pt-2 pb-6">
          <Button className="w-full rounded-xl" variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Komponen helper kecil untuk merapikan baris detail
function DetailItem({ icon, label, value }) {
  if (!value) return null;
  
  return (
    <div className="flex items-start gap-3 p-3 border border-gray-100 bg-gray-50 rounded-xl">
      <div className="text-gray-400 mt-0.5 [&>svg]:w-4 [&>svg]:h-4">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-all">{value}</p>
      </div>
    </div>
  );
}