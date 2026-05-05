import { Clock, MapPin, Navigation, User, Users, ZoomIn, X, Flame } from 'lucide-react';
import { useState } from 'react';
import DialogRelawanDetail from './DialogRelawanDetail';
import DialogRelawanList from './DialogRelawanList';
import HelpConfirmAlertDialog from './HelpConfirmAlertDialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function ReportCard({ report, currentUser, onSuccess }) {
    const [showList, setShowList] = useState(false);
    const [selectedHelper, setSelectedHelper] = useState(null);
    const [showImage, setShowImage] = useState(false);

    const handleSelectHelper = (helper) => {
        setSelectedHelper(helper);
        setShowList(false);
    };
    
    const handleBackToList = () => {
        setSelectedHelper(null);
        setShowList(true);
    };

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${report.location_lat},${report.location_lng}`;
    const hasHelpers = report.helpers?.length > 0;
    const hasPhoto = !!report.photo;

    const isOwner = currentUser && currentUser.id === report.user_id;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#151515] rounded-xl overflow-hidden border border-[#e5e5e5] dark:border-[#262626] shadow-sm hover:border-gray-300 dark:hover:border-[#333] transition-colors duration-200 group">
            
            <div className="flex flex-col flex-1 p-5">
                
                {/* --- HEADER --- */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="flex items-start flex-1 min-w-0 gap-2 text-base font-semibold leading-snug text-gray-900 dark:text-gray-100 line-clamp-2">
                        <Flame size={18} className="text-[#b42826] shrink-0 mt-0.5" />
                        {report.title}
                    </h2>
                    
                    {hasHelpers ? (
                        <span className="shrink-0 bg-blue-50 dark:bg-[#111e36] text-blue-600 dark:text-[#60a5fa] text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md border border-blue-100 dark:border-[#1e3a5f]">
                            Diproses
                        </span>
                    ) : (
                        <span className="shrink-0 bg-red-50 dark:bg-[#2a1313] text-red-600 dark:text-[#ff6b6b] text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md border border-red-100 dark:border-[#4a1c1c] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            Menunggu
                        </span>
                    )}
                </div>

                {/* --- METADATA --- */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                        <Clock size={14} /> 
                        {report.created_at}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <User size={14} />
                        <span className="truncate max-w-[120px]">{report.user?.name}</span>
                    </span>
                </div>

                {/* --- GAMBAR BUKTI --- */}
                {hasPhoto && (
                    <div 
                        className="relative w-full mb-4 overflow-hidden border border-[#e5e5e5] dark:border-[#262626] cursor-pointer h-40 rounded-lg group/img bg-gray-50 dark:bg-[#101010] shrink-0"
                        onClick={() => setShowImage(true)}
                    >
                        <img src={report.photo} alt="Foto laporan" className="object-cover w-full h-full transition-transform duration-500 group-hover/img:scale-105" />
                        <div className="absolute inset-0 flex items-center justify-center transition-colors duration-300 bg-black/0 group-hover/img:bg-black/20">
                            <div className="flex items-center gap-2 p-1.5 px-4 text-gray-800 transition-opacity duration-300 transform translate-y-2 rounded-md shadow-sm opacity-0 bg-white/95 dark:bg-[#151515]/95 dark:text-gray-200 group-hover/img:opacity-100 backdrop-blur-sm group-hover/img:translate-y-0 border border-[#e5e5e5] dark:border-[#262626]">
                                <ZoomIn size={14} />
                                <span className="text-xs font-medium">Perbesar</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- LOKASI & DESKRIPSI --- */}
                <div className="flex items-start gap-2.5 mb-3 text-sm text-gray-700 dark:text-gray-300">
                    <MapPin size={16} className="text-[#b42826] shrink-0 mt-0.5" />
                    <span className="leading-snug line-clamp-2">{report.address}</span>
                </div>

                <p className="mb-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-3">
                    {report.description}
                </p>
                
            </div>

            {/* --- BAGIAN BAWAH: Relawan & Action Buttons --- */}
            <div className="px-5 pb-5 mt-auto border-t border-[#e5e5e5] dark:border-[#262626] pt-4">
                
                {/* Status Relawan */}
                {hasHelpers ? (
                    <button
                        className="flex items-center justify-between w-full mb-4 text-sm font-medium text-blue-600 transition-colors dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus-visible:outline-none"
                        onClick={() => setShowList(true)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {report.helpers.slice(0, 3).map((h, i) => (
                                    <div key={i} className="flex items-center justify-center w-6 h-6 text-[9px] font-bold text-white border border-white rounded-full dark:border-[#151515] bg-blue-500">
                                        {h.user?.name?.[0]?.toUpperCase() ?? '?'}
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs">{report.helpers.length} Relawan merespons</span>
                        </div>
                        <span className="text-lg leading-none">›</span>
                    </button>
                ) : (
                    <div className="flex items-center w-full gap-2 mb-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <Users size={14} /> 
                        Belum ada yang merespons
                    </div>
                )}

                {/* Tombol Aksi */}
                <div className="flex gap-2">
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex-none outline-none">
                        <button className="flex items-center justify-center gap-1.5 px-3 text-sm font-medium text-gray-700 transition-colors bg-transparent border border-[#e5e5e5] h-9 dark:text-gray-300 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-[#1f1f1f] rounded-md focus-visible:ring-2 focus-visible:ring-gray-300">
                            <Navigation size={14} />
                            Lokasi
                        </button>
                    </a>
                    
                    <div className="flex-1">
                        {isOwner ? (
                            <button className="flex items-center justify-center w-full text-sm font-medium text-gray-600 transition-colors bg-gray-100 border border-transparent h-9 dark:text-gray-300 rounded-md dark:bg-[#1f1f1f] hover:bg-gray-200 dark:hover:bg-[#262626]">
                                Laporan Anda
                            </button>
                        ) : (
                            <HelpConfirmAlertDialog 
                                reportId={report.id} 
                                className="flex items-center justify-center w-full text-sm font-medium text-white transition-colors bg-[#b42826] h-9 rounded-md hover:bg-[#9a2220] focus:ring-2 focus:ring-[#b42826]/50" 
                                onSuccess={onSuccess}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}
            <DialogRelawanList open={showList} onClose={() => setShowList(false)} helpers={report.helpers} onSelect={handleSelectHelper} />
            <DialogRelawanDetail open={!!selectedHelper} onClose={() => setSelectedHelper(null)} onBack={handleBackToList} helper={selectedHelper} />

            <Dialog open={showImage} onOpenChange={setShowImage}>
                <DialogContent className="max-w-4xl w-[95vw] md:w-full p-0 bg-transparent border-none shadow-none flex justify-center items-center [&>button]:hidden outline-none">
                    <div className="relative inline-flex justify-center">
                        <button
                            onClick={() => setShowImage(false)}
                            className="absolute z-50 flex items-center justify-center w-8 h-8 text-white transition-colors duration-200 border rounded-md shadow-sm cursor-pointer top-3 right-3 bg-black/60 dark:bg-black/80 border-white/30 hover:bg-red-600 hover:border-red-600 backdrop-blur-md"
                            aria-label="Tutup gambar"
                        >
                            <X size={16} strokeWidth={2} />
                        </button>
                        <img 
                            src={report.photo} 
                            alt="Foto kejadian detail" 
                            className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-lg shadow-xl bg-black/20 dark:bg-[#101010]" 
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}