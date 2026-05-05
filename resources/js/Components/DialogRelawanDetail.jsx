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
      {/* PERBAIKAN: Menambahkan 'overflow-hidden' agar background anak elemen tidak bocor di sudut-sudutnya */}
      <DialogContent className="p-0 sm:max-w-md w-[95vw] max-h-[calc(100vh-120px)] mb-[80px] sm:mb-0 flex flex-col rounded-xl overflow-hidden border border-[#e5e5e5] shadow-sm dark:bg-[#151515] dark:border-[#262626] outline-none">
        
        {/* HEADER */}
        <DialogHeader className="z-10 flex flex-row items-center gap-3 px-4 py-4 space-y-0 overflow-hidden border-b border-[#e5e5e5] shrink-0 dark:border-[#262626] bg-white dark:bg-[#151515]">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="w-8 h-8 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-[#1f1f1f]"
          >
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </Button>
          <DialogTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Profil Relawan
          </DialogTitle>
        </DialogHeader>

        {/* KONTEN TENGAH */}
        <div className="flex-1 p-5 overflow-y-auto bg-gray-50 dark:bg-[#101010]">
          {helper && (
            <>
              <div className="flex flex-col items-center mb-6">
                 <div className="flex items-center justify-center w-20 h-20 mb-3 text-3xl font-semibold text-gray-700 border border-[#e5e5e5] rounded-full shadow-sm bg-white dark:bg-[#1f1f1f] dark:border-[#262626] dark:text-gray-300">
                    {helper.user?.name?.[0]?.toUpperCase() ?? '?'}
                 </div>
                 <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-gray-100">
                    {helper.user?.name}
                 </h3>
                 <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md mt-2 border border-blue-100 dark:bg-[#111e36] dark:border-[#1e3a5f] dark:text-[#60a5fa] uppercase tracking-wider">
                    Relawan Terdaftar
                 </span>
              </div>

              <div className="space-y-2.5">
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
        <div className="px-5 pt-3 pb-4 border-t border-[#e5e5e5] shrink-0 dark:border-[#262626] bg-white dark:bg-[#151515]">
          <Button 
            className="w-full font-medium text-gray-700 transition-colors border border-[#e5e5e5] bg-transparent h-10 rounded-lg hover:bg-gray-50 dark:border-[#262626] dark:text-gray-300 dark:hover:bg-[#1f1f1f]" 
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
        className={`flex items-center gap-3 p-3.5 border border-[#e5e5e5] bg-white rounded-lg shadow-sm dark:border-[#262626] dark:bg-[#151515] transition-colors ${
            href ? 'hover:border-gray-300 dark:hover:border-[#333] group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gray-300' : ''
        }`}
    >
      <div className={`mt-0.5 [&>svg]:w-[16px] [&>svg]:h-[16px] transition-colors ${href ? 'text-gray-600 dark:text-gray-300 group-hover:scale-105' : 'text-gray-400 dark:text-gray-500'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className={`text-[13px] font-medium break-words leading-tight transition-colors ${href ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
          {value}
        </p>
      </div>
      
      {actionIcon && (
          <div className="text-gray-400 transition-colors dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 shrink-0">
              <ExternalLink size={14} />
          </div>
      )}
    </ContentWrapper>
  );
}