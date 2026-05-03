import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Mail, MapPin, Phone, ExternalLink } from "lucide-react";

export default function DialogRelawanDetail({ open, onClose, helper, onBack }) {
  const getMapsUrl = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 sm:max-w-md w-[95vw] max-h-[calc(100vh-120px)] mb-[80px] sm:mb-0 flex flex-col rounded-[24px] border border-gray-100 shadow-2xl dark:bg-slate-900 dark:border-slate-800 outline-none">
        
        {/* HEADER */}
        <DialogHeader className="z-10 flex flex-row items-center gap-3 px-4 py-4 space-y-0 overflow-hidden border-b border-gray-100 shrink-0 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-t-[24px]">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="w-8 h-8 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} className="text-gray-600 dark:text-slate-400" />
          </Button>
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-slate-100">
            Profil Relawan
          </DialogTitle>
        </DialogHeader>

        {/* KONTEN TENGAH */}
        <div className="flex-1 p-6 overflow-y-auto dark:bg-slate-900">
          {helper && (
            <>
              <div className="flex flex-col items-center mb-6">
                 {/* REVISI: Avatar Biru */}
                 <div className="flex items-center justify-center w-24 h-24 mb-3 text-4xl font-bold text-blue-600 border-4 border-blue-100 rounded-full shadow-inner bg-blue-50 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400">
                    {helper.user?.name?.[0]?.toUpperCase() ?? '?'}
                 </div>
                 <h3 className="text-xl font-bold text-center text-gray-900 dark:text-slate-100">
                    {helper.user?.name}
                 </h3>
                 <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full mt-1.5 border border-blue-200 dark:bg-blue-900/40 dark:border-blue-800/60 dark:text-blue-400 uppercase tracking-wide">
                    Relawan Terdaftar
                 </span>
              </div>

              {/* REVISI: Menambahkan href agar bisa diklik */}
              <div className="space-y-3">
                <DetailItem 
                  icon={<Phone />} 
                  label="Nomor Handphone" 
                  value={helper.user?.phone || 'Tidak dicantumkan'} 
                  href={helper.user?.phone ? `tel:${helper.user.phone}` : null}
                  actionIcon={helper.user?.phone ? true : false}
                />
                
                <DetailItem 
                  icon={<MapPin />} 
                  label="Posisi Relawan" 
                  value="Buka di Google Maps" 
                  href={getMapsUrl(helper.location_lat, helper.location_lng)}
                  actionIcon={true}
                />

                <DetailItem 
                  icon={<Mail />} 
                  label="Email" 
                  value={helper.user?.email} 
                  href={helper.user?.email ? `mailto:${helper.user.email}` : null}
                />
                
                <DetailItem 
                  icon={<Calendar />} 
                  label="Waktu Respons" 
                  value={helper.created_at} 
                />
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 pt-3 pb-3 border-t border-gray-100 shrink-0 dark:border-slate-800 rounded-b-[24px] dark:bg-slate-900">
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

// REVISI: Komponen helper dikembangkan agar mendukung Link (bisa diklik)
function DetailItem({ icon, label, value, href, actionIcon }) {
  if (!value) return null;
  
  const ContentWrapper = href ? 'a' : 'div';
  const linkProps = href ? { 
      href, 
      target: href.startsWith('http') ? '_blank' : '_self',
      rel: href.startsWith('http') ? 'noopener noreferrer' : '' 
  } : {};

  return (
    <ContentWrapper 
        {...linkProps}
        className={`flex items-center gap-3 p-3.5 border border-gray-100 bg-gray-50 rounded-2xl dark:border-slate-800 dark:bg-slate-800/40 transition-colors ${
            href ? 'hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-slate-800 dark:hover:border-slate-600 group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500' : ''
        }`}
    >
      <div className={`mt-0.5 [&>svg]:w-[18px] [&>svg]:h-[18px] transition-colors ${href ? 'text-blue-500 dark:text-blue-400 group-hover:scale-110' : 'text-gray-400 dark:text-slate-500'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <p className={`text-[14px] font-bold break-words leading-tight transition-colors ${href ? 'text-blue-700 dark:text-blue-300 group-hover:text-blue-800 dark:group-hover:text-blue-200' : 'text-gray-900 dark:text-slate-200 font-medium'}`}>
          {value}
        </p>
      </div>
      
      {/* Jika ini adalah link aksi (seperti telepon/maps), tampilkan ikon panah keluar */}
      {actionIcon && (
          <div className="text-gray-300 transition-colors dark:text-slate-600 group-hover:text-blue-500 shrink-0">
              <ExternalLink size={16} />
          </div>
      )}
    </ContentWrapper>
  );
}