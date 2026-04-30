import { AlertTriangle, Clock, MapPin, Navigation, User, Users, ZoomIn, X } from 'lucide-react';
import { useState } from 'react';
import DialogRelawanDetail from './DialogRelawanDetail';
import DialogRelawanList from './DialogRelawanList';
import HelpConfirmAlertDialog from './HelpConfirmAlertDialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function ReportCard({ report }) {
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

    return (
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group">
            
            <div className="flex flex-col flex-1 p-5 sm:p-6">
                {/* Header: Judul & Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="flex items-start flex-1 min-w-0 gap-2 text-base font-bold leading-snug text-gray-900 dark:text-slate-100">
                        <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                        {report.title}
                    </h2>
                    <span className="shrink-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border border-red-100 dark:border-red-900/30">
                        Laporan
                    </span>
                </div>

                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 flex items-center gap-1.5 mb-4">
                    <Clock size={14} className="text-amber-500" /> 
                    {report.created_at}
                </p>

                {/* Gambar Berbingkai */}
                {hasPhoto && (
                    <div 
                        className="relative w-full mb-5 overflow-hidden border border-gray-200 cursor-pointer h-44 rounded-2xl group/img dark:border-slate-700/50 bg-gray-50 dark:bg-slate-800/50 shrink-0"
                        onClick={() => setShowImage(true)}
                    >
                        <img src={report.photo} alt="Foto laporan" className="object-cover w-full h-full transition-transform duration-700 group-hover/img:scale-110" />
                        <div className="absolute inset-0 flex items-center justify-center transition-colors duration-300 bg-black/0 group-hover/img:bg-black/30">
                            <div className="flex items-center gap-2 p-2 px-5 transition-opacity duration-300 transform translate-y-4 rounded-full shadow-sm opacity-0 bg-white/90 dark:bg-slate-800/90 text-amber-600 dark:text-amber-500 group-hover/img:opacity-100 backdrop-blur-sm group-hover/img:translate-y-0">
                                <ZoomIn size={16} />
                                <span className="text-xs font-bold">Perbesar</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mb-5 space-y-3">
                    <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-slate-300">
                        <MapPin size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <span className="leading-snug line-clamp-2">{report.address}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300">
                        <User size={16} className="text-amber-500 shrink-0" />
                        <span className="truncate">{report.user?.name}</span>
                    </div>
                </div>

                <div className="p-4 mb-2 border bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border-amber-100 dark:border-amber-900/20">
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-slate-300 line-clamp-3">
                        {report.description}
                    </p>
                </div>
            </div>

            <div className="px-5 pb-5 mt-auto sm:px-6 sm:pb-6">
                {/* Status Relawan dengan Tema Amber */}
                {hasHelpers ? (
                    <button
                        className="w-full mb-4 flex items-center justify-between text-sm font-bold text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/30 transition-all rounded-2xl px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        onClick={() => setShowList(true)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {report.helpers.slice(0, 3).map((h, i) => (
                                    <div key={i} className="flex items-center justify-center w-8 h-8 text-xs font-bold text-white border-2 border-white rounded-full shadow-sm dark:border-slate-900 bg-amber-500">
                                        {h.user?.name?.[0]?.toUpperCase() ?? '?'}
                                    </div>
                                ))}
                            </div>
                            <span>{report.helpers.length} Relawan siap bantu</span>
                        </div>
                        <span className="text-lg leading-none text-amber-500">›</span>
                    </button>
                ) : (
                    <div className="w-full mb-4 flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/30 rounded-2xl px-4 py-3.5 border border-gray-200 dark:border-slate-700 border-dashed">
                        <Users size={18} className="text-gray-400 dark:text-slate-500" /> 
                        Belum ada relawan
                    </div>
                )}

                <div className="flex gap-3">
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex-none outline-none">
                        <button className="flex items-center justify-center h-12 gap-2 px-5 text-sm font-bold text-gray-700 transition-all bg-white border border-gray-300 shadow-sm dark:text-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 hover:border-amber-300 rounded-xl focus-visible:ring-2 focus-visible:ring-amber-500">
                            <Navigation size={18} className="text-amber-500" />
                            Maps
                        </button>
                    </a>
                    <HelpConfirmAlertDialog reportId={report.id} className="flex-1 h-12 text-sm font-bold text-white shadow-md rounded-xl bg-amber-500 hover:bg-amber-600" />
                </div>
            </div>

            {/* Modal */}
            <DialogRelawanList open={showList} onClose={() => setShowList(false)} helpers={report.helpers} onSelect={handleSelectHelper} />
            <DialogRelawanDetail open={!!selectedHelper} onClose={() => setSelectedHelper(null)} onBack={handleBackToList} helper={selectedHelper} />

            {/* Modal Gambar */}
            <Dialog open={showImage} onOpenChange={setShowImage}>
                <DialogContent className="max-w-4xl w-[95vw] md:w-full p-0 bg-transparent border-none shadow-none flex justify-center items-center [&>button]:hidden outline-none">
                    
                    {/* Wrapper relative yang membungkus gambar secara pas */}
                    <div className="relative inline-flex justify-center">
                        
                        {/* Tombol diletakkan di dalam area gambar (absolute top-3 right-3) */}
                        <button
                            onClick={() => setShowImage(false)}
                            className="absolute top-3 right-3 z-50 flex items-center justify-center w-10 h-10 text-white bg-black/60 dark:bg-black/80 border-[1.5px] border-white/70 dark:border-slate-400 rounded-full shadow-lg hover:bg-red-500 hover:border-red-500 transition-colors duration-200 backdrop-blur-md cursor-pointer"
                            aria-label="Tutup gambar"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                        
                        <img 
                            src={report.photo} 
                            alt="Foto kejadian detail" 
                            className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl bg-black/20 dark:bg-black/60" 
                        />
                    </div>

                </DialogContent>
            </Dialog>
        </div>
    );
}