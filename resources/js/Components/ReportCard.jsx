import { Clock, MapPin, Navigation, User, Users, ZoomIn, X, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import DialogRelawanDetail from './DialogRelawanDetail';
import DialogRelawanList from './DialogRelawanList';
import HelpConfirmAlertDialog from './HelpConfirmAlertDialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export default function ReportCard({ report, currentUser, onSuccess, isRelawan }) {
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

    const lat = report.lat || report.location_lat;
    const lng = report.lng || report.location_lng;
    const googleMapsUrl = `http://googleusercontent.com/maps.google.com/maps?q=${lat},${lng}`;
    
    const hasHelpers = report.helpers?.length > 0;
    const hasPhoto = !!report.photo;
    
    const isOwner = currentUser && currentUser.id === report.user_id;
    const isMyTask = currentUser && report.helpers?.some(h => h.user_id === currentUser.id);

    const getStatusConfig = () => {
        if (report.status === 'resolved') return { label: 'Selesai', color: 'bg-gray-100 text-gray-600 border-[#e5e5e5] dark:bg-[#1a1a1a] dark:text-gray-400 dark:border-[#333]', icon: <CheckCircle2 size={12} className="mr-1 shrink-0" /> };
        if (report.status === 'handling' || hasHelpers) return { label: 'Penanganan', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-400', icon: <ShieldAlert size={12} className="mr-1 shrink-0" /> };
        return { label: 'Darurat', color: 'bg-red-50 text-[#b42826] border-red-200 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400', icon: <span className="w-1.5 h-1.5 rounded-full bg-[#b42826] dark:bg-red-500 animate-pulse mr-1.5 shrink-0"></span> };
    };
    const statusConfig = getStatusConfig();

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#151515] rounded-xl overflow-hidden border border-[#e5e5e5] dark:border-[#262626] shadow-none hover:border-gray-300 dark:hover:border-[#444] transition-colors duration-200 group">
            
            <div className="flex flex-col flex-1 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="flex items-start flex-1 min-w-0 gap-2 text-base font-bold leading-snug text-gray-900 dark:text-gray-100 line-clamp-2">
                        <Flame size={16} className="text-[#b42826] dark:text-[#e54845] shrink-0 mt-0.5" strokeWidth={2.5} />
                        {report.title}
                    </h2>
                    <span className={cn("shrink-0 flex items-center text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border shadow-none whitespace-nowrap", statusConfig.color)}>
                        {statusConfig.icon}
                        {statusConfig.label}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                        <Clock size={12} strokeWidth={2.5} className="shrink-0" /> 
                        {typeof report.created_at === 'string' ? report.created_at.split('T')[0] : 'Baru'}
                    </span>
                    <span className="flex items-center min-w-0 gap-1">
                        <User size={12} strokeWidth={2.5} className="shrink-0" />
                        <span className="truncate">{report.name || report.user?.name || 'Warga'}</span>
                    </span>
                </div>

                {hasPhoto && (
                    <div className="relative w-full mb-3 overflow-hidden border border-[#e5e5e5] dark:border-[#262626] cursor-pointer h-36 rounded-lg group/img bg-gray-100 dark:bg-[#101010] shrink-0 shadow-none" onClick={() => setShowImage(true)}>
                        <img src={`/storage/${report.photo}`} alt="Foto laporan" onError={(e) => e.target.src = report.photo} className="object-cover w-full h-full grayscale-[15%] group-hover/img:grayscale-0 transition-all duration-500 group-hover/img:scale-105" />
                        <div className="absolute inset-0 flex items-center justify-center transition-colors duration-300 bg-black/5 group-hover/img:bg-black/30">
                            <div className="flex items-center gap-1.5 p-1.5 px-3 text-gray-900 transition-all duration-300 transform translate-y-2 rounded-md shadow-none opacity-0 bg-white/95 dark:bg-[#151515]/95 dark:text-white group-hover/img:opacity-100 backdrop-blur-sm group-hover/img:translate-y-0 border border-[#e5e5e5] dark:border-[#333]">
                                <ZoomIn size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Perbesar</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-start gap-2 mb-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                    <MapPin size={14} className="text-[#b42826] dark:text-[#e54845] shrink-0 mt-0.5" />
                    <span className="leading-snug line-clamp-2">{report.address}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">
                    {report.description || 'Tidak ada deskripsi rinci.'}
                </p>
            </div>

            <div className="px-4 pb-4 mt-auto border-t border-[#e5e5e5] dark:border-[#262626] pt-3 bg-gray-50/50 dark:bg-[#101010]/50">
                
                {hasHelpers ? (
                    <button 
                        type="button"
                        className="flex items-center justify-between w-full mb-3 text-[11px] font-bold transition-colors text-gray-900 dark:text-gray-100 hover:text-[#b42826] dark:hover:text-[#e54845] outline-none group/helper" 
                        onClick={() => setShowList(true)}
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="flex -space-x-1.5">
                                {report.helpers.slice(0, 3).map((h, i) => (
                                    <div key={i} className="flex items-center justify-center w-5 h-5 text-[8px] font-bold text-white border border-white rounded-full dark:border-[#101010] bg-gray-900 dark:bg-gray-700 shadow-none transition-colors group-hover/helper:bg-[#b42826]">
                                        {h.user?.name?.[0]?.toUpperCase() ?? '?'}
                                    </div>
                                ))}
                            </div>
                            <span>{report.helpers.length} Relawan Merespons</span>
                        </div>
                        <span className="text-base leading-none">›</span>
                    </button>
                ) : (
                    <div className="flex items-center w-full gap-1.5 mb-3 text-[9px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-widest">
                        <Users size={12} /> Belum Ada Responden
                    </div>
                )}

                {/* 👇 FIX: TOMBOL EKSTRA KOMPAK (h-8 atau 32px) 👇 */}
                <div className="flex items-stretch gap-2">
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex-none outline-none">
                        <button type="button" className="flex items-center justify-center w-8 h-8 transition-colors bg-white border border-[#e5e5e5] rounded-md shadow-none text-gray-600 hover:bg-gray-100 dark:bg-[#151515] dark:border-[#333] dark:text-gray-400 dark:hover:bg-[#1a1a1a] dark:hover:text-white focus-visible:ring-2 focus-visible:ring-gray-300">
                            <Navigation size={14} strokeWidth={2.5} />
                        </button>
                    </a>
                    
                    <div className="flex-1">
                        {isOwner ? (
                            <Link href={route('reports.show', report.id)} className="flex items-center justify-center w-full h-8 text-[10px] font-bold text-gray-900 uppercase tracking-wider transition-colors bg-white border border-[#e5e5e5] rounded-md shadow-none dark:bg-[#151515] dark:border-[#333] dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]">
                                Pantau Laporan
                            </Link>
                        ) : isMyTask ? (
                            <Link href={route('reports.show', report.id)} className="flex items-center justify-center w-full h-8 text-[10px] font-bold text-white uppercase tracking-wider transition-colors bg-gray-900 border border-transparent rounded-md shadow-none dark:bg-white dark:text-black hover:bg-black dark:hover:bg-gray-200">
                                Peta Operasional
                            </Link>
                        ) : report.status === 'resolved' ? (
                            <button disabled type="button" className="flex items-center justify-center w-full h-8 text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-colors bg-gray-100 border border-[#e5e5e5] rounded-md dark:bg-[#1a1a1a] dark:border-[#333] dark:text-gray-600 cursor-not-allowed shadow-none">
                                Kasus Selesai
                            </button>
                        ) : isRelawan ? (
                            <HelpConfirmAlertDialog 
                                reportId={report.id} 
                                className="flex items-center justify-center w-full h-8 text-[10px] font-bold text-white uppercase tracking-wider transition-colors bg-[#b42826] hover:bg-[#9a2220] rounded-md shadow-none border border-[#9a2220] focus:ring-2 focus:ring-[#b42826]/50 outline-none" 
                                onSuccess={onSuccess} 
                            />
                        ) : (
                            <button disabled type="button" className="flex items-center justify-center w-full h-8 text-[10px] font-bold text-gray-500 uppercase tracking-wider transition-colors bg-gray-50 border border-[#e5e5e5] rounded-md dark:bg-[#151515] dark:border-[#333] dark:text-gray-500 cursor-not-allowed shadow-none">
                                {hasHelpers ? 'Dalam Penanganan' : 'Menunggu Relawan'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* MODALS */}
            <DialogRelawanList open={showList} onClose={() => setShowList(false)} helpers={report.helpers} onSelect={handleSelectHelper} />
            <DialogRelawanDetail open={!!selectedHelper} onClose={() => setSelectedHelper(null)} onBack={handleBackToList} helper={selectedHelper} />
            <Dialog open={showImage} onOpenChange={setShowImage}>
                <DialogContent className="max-w-4xl w-[95vw] md:w-full p-0 bg-transparent border-none shadow-none flex justify-center items-center [&>button]:hidden outline-none">
                    <div className="relative inline-flex items-center justify-center w-full h-full">
                        <button onClick={() => setShowImage(false)} className="absolute z-50 flex items-center justify-center w-10 h-10 text-gray-900 bg-white hover:bg-gray-100 rounded-full top-2 right-2 border border-[#e5e5e5] transition-colors shadow-none outline-none">
                            <X size={20} />
                        </button>
                        <img src={`/storage/${report.photo}`} onError={(e) => e.target.src = report.photo} alt="Foto kejadian detail" className="w-auto h-auto max-w-[100vw] max-h-[90vh] object-contain rounded-md shadow-none border border-[#e5e5e5] dark:border-[#262626] bg-black/20" />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}