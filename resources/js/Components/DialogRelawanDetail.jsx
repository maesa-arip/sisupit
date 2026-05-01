import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Mail, MapPin, Phone } from "lucide-react";

export default function DialogRelawanDetail({ open, onClose, helper, onBack }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* 
        PERBAIKAN KUNCI DI SINI:
        1. mb-[80px] sm:mb-0 : Menambahkan margin bawah khusus di HP agar menghindari Mobile Nav. (Sesuaikan angka 80px dengan tinggi asli Mobile Nav Anda).
        2. max-h-[calc(100vh-100px)] : Memastikan tinggi maksimal tidak memakan tinggi layar penuh ditambah marginnya.
      */}
      <DialogContent className="p-0 sm:max-w-md w-[95vw] max-h-[calc(100vh-120px)] mb-[80px] sm:mb-0 flex flex-col rounded-[28px] border border-gray-100 shadow-2xl dark:bg-slate-900 dark:border-slate-800 outline-none">
        
        {/* HEADER */}
        <DialogHeader className="z-10 flex flex-row items-center gap-3 px-4 py-4 space-y-0 overflow-hidden border-b border-gray-100 rounded-[28px] shrink-0 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="w-8 h-8 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} className="text-gray-600 dark:text-slate-400" />
          </Button>
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
            Detail Relawan
          </DialogTitle>
        </DialogHeader>

        {/* KONTEN TENGAH (Bisa di-scroll) */}
        <div className="flex-1 p-6 overflow-y-auto dark:bg-slate-900">
          {helper && (
            <>
              {/* ... (Isi profil relawan dan DetailItem tetap sama seperti sebelumnya) ... */}
              <div className="flex flex-col items-center mb-6">
                 <div className="flex items-center justify-center w-24 h-24 mb-3 text-4xl font-bold border-4 rounded-full shadow-inner text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/30 dark:border-amber-800/50 dark:text-amber-400">
                    {helper.user?.name?.[0]?.toUpperCase() ?? '?'}
                 </div>
                 <h3 className="text-lg font-bold text-center text-gray-900 dark:text-slate-100">
                    {helper.user?.name}
                 </h3>
                 <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full mt-1.5 border border-amber-200 dark:bg-amber-900/40 dark:border-amber-800/60 dark:text-amber-400 uppercase tracking-wide">
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
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 pt-3 pb-3 border-t border-gray-100 shrink-0 dark:border-slate-800 rounded-[28px] dark:bg-slate-900">
          <Button 
            className="w-full font-bold text-gray-700 transition-colors border-gray-200 h-11 rounded-xl hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white" 
            variant="outline" 
            onClick={onClose}
          >
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
    <div className="flex items-start gap-3 p-3.5 border border-gray-100 bg-gray-50 rounded-2xl dark:border-slate-800 dark:bg-slate-800/40 transition-colors">
      <div className="mt-0.5 text-gray-400 dark:text-slate-500 [&>svg]:w-[18px] [&>svg]:h-[18px]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-[14px] font-medium text-gray-900 dark:text-slate-200 break-words leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}