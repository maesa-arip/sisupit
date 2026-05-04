import { AlertTriangle, Clock, MapPin, Navigation, User, Users, ZoomIn, X, Flame } from 'lucide-react';
import { useState } from 'react';
import DialogRelawanDetail from './DialogRelawanDetail';
import DialogRelawanList from './DialogRelawanList';
import HelpConfirmAlertDialog from './HelpConfirmAlertDialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
// import VolunteerAction from './VolunteerAction'; // Pastikan jika tidak dipakai dihapus saja

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
        // REVISI: rounded-[28px] diubah ke rounded-[20px] agar lebih tegas dan profesional
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-[20px] overflow-hidden border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 group">
            
            <div className="flex flex-col flex-1 p-5 sm:p-6">
                
                {/* --- HEADER: Judul & Status Dinamis --- */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="flex items-start flex-1 min-w-0 gap-2 text-base font-bold leading-snug text-gray-900 dark:text-slate-100 line-clamp-2">
                        {/* Ikon api/alert merah menegaskan kegawatan */}
                        <Flame size={18} className="text-red-500 shrink-0 mt-0.5" />
                        {report.title}
                    </h2>
                    
                    {/* REVISI: Badge berubah fungsi jadi Status. Jika ada relawan = Diproses, jika 0 = Menunggu */}
                    {hasHelpers ? (
                        <span className="shrink-0 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-900/30">
                            Diproses
                        </span>
                    ) : (
                        <span className="shrink-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border border-red-100 dark:border-red-900/30 flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Menunggu
                        </span>
                    )}
                </div>

                {/* --- METADATA (Netral agar tidak bising) --- */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-[11px] sm:text-xs font-medium text-gray-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 text-gray-700 dark:text-slate-300 font-semibold">
                        <Clock size={14} className="text-gray-400 dark:text-slate-500" /> 
                        {report.created_at}
                    </span>
                    <span className="flex items-center gap-1.5 opacity-80">
                        <User size={14} className="text-gray-400 dark:text-slate-500" />
                        <span className="truncate max-w-[120px]">Dilaporkan oleh: {report.user?.name}</span>
                    </span>
                </div>

                {/* --- GAMBAR BUKTI --- */}
                {hasPhoto && (
                    <div 
                        className="relative w-full mb-4 overflow-hidden border border-gray-100 cursor-pointer h-44 rounded-xl group/img dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 shrink-0"
                        onClick={() => setShowImage(true)}
                    >
                        <img src={report.photo} alt="Foto laporan" className="object-cover w-full h-full transition-transform duration-700 group-hover/img:scale-105" />
                        <div className="absolute inset-0 flex items-center justify-center transition-colors duration-300 bg-black/0 group-hover/img:bg-black/20">
                            <div className="flex items-center gap-2 p-2 px-5 text-gray-700 transition-opacity duration-300 transform translate-y-4 rounded-full shadow-sm opacity-0 bg-white/95 dark:bg-slate-800/95 dark:text-slate-200 group-hover/img:opacity-100 backdrop-blur-sm group-hover/img:translate-y-0">
                                <ZoomIn size={16} />
                                <span className="text-xs font-bold">Perbesar</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- LOKASI & DESKRIPSI --- */}
                <div className="flex items-start gap-2.5 mb-3 text-sm text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                    <MapPin size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <span className="leading-snug line-clamp-2">{report.address}</span>
                </div>

                {/* REVISI: Deskripsi dilepas dari background amber, dibiarkan bersih */}
                <p className="mb-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400 line-clamp-3">
                    {report.description}
                </p>
                
            </div>

            {/* --- BAGIAN BAWAH: Relawan & Action Buttons --- */}
            <div className="px-5 pb-5 mt-auto sm:px-6 sm:pb-6">
                
                {/* Status Relawan */}
                {hasHelpers ? (
                    <button
                        className="flex items-center justify-between w-full px-4 py-3 mb-4 text-sm font-bold text-blue-700 transition-all border border-blue-100 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 dark:border-blue-800/30 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        onClick={() => setShowList(true)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {report.helpers.slice(0, 3).map((h, i) => (
                                    <div key={i} className="flex items-center justify-center w-7 h-7 text-[10px] font-bold text-white border-2 border-white rounded-full shadow-sm dark:border-slate-900 bg-blue-500">
                                        {h.user?.name?.[0]?.toUpperCase() ?? '?'}
                                    </div>
                                ))}
                            </div>
                            <span>{report.helpers.length} Relawan merespons</span>
                        </div>
                        <span className="text-lg leading-none text-blue-500">›</span>
                    </button>
                ) : (
                    <div className="flex items-center w-full gap-2 px-4 py-3 mb-4 text-sm font-medium text-gray-500 border border-gray-200 border-dashed dark:text-slate-400 bg-gray-50 dark:bg-slate-800/30 rounded-xl dark:border-slate-700">
                        <Users size={18} className="text-gray-400 dark:text-slate-500" /> 
                        Belum ada yang merespons
                    </div>
                )}

                {/* Tombol Aksi */}
                <div className="flex gap-3 mt-4">
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex-none outline-none">
                        <button className="flex items-center justify-center gap-2 px-4 text-sm font-bold text-gray-700 transition-all bg-white border border-gray-300 shadow-sm h-11 dark:text-slate-200 dark:bg-slate-800 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 rounded-xl focus-visible:ring-2 focus-visible:ring-gray-300">
                            <Navigation size={16} className="text-gray-500" />
                            Lokasi
                        </button>
                    </a>
                    
                    {/* REVISI 3: Logika Tombol Aksi */}
                    <div className="flex-1">
                        {isOwner ? (
                            // Jika ini laporannya sendiri, beri label yang berbeda (Misal diarahkan ke halaman detail untuk edit/selesaikan)
                            <button className="flex items-center justify-center w-full text-sm font-bold text-gray-600 transition-colors bg-gray-100 border border-gray-200 shadow-sm h-11 dark:text-gray-300 rounded-xl dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 dark:border-slate-700">
                                Laporan Anda
                            </button>
                        ) : (
                            // Jika bukan laporannya, tampilkan tombol Bantu
                            <HelpConfirmAlertDialog 
                                reportId={report.id} 
                                className="flex items-center justify-center w-full text-sm font-bold text-white transition-colors bg-blue-600 shadow-md h-11 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/30" 
                                onSuccess={onSuccess}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}
            <DialogRelawanList open={showList} onClose={() => setShowList(false)} helpers={report.helpers} onSelect={handleSelectHelper} />
            <DialogRelawanDetail open={!!selectedHelper} onClose={() => setSelectedHelper(null)} onBack={handleBackToList} helper={selectedHelper} />

            {/* Modal Gambar tetap sama, desain Anda sudah bagus di bagian ini */}
            <Dialog open={showImage} onOpenChange={setShowImage}>
                <DialogContent className="max-w-4xl w-[95vw] md:w-full p-0 bg-transparent border-none shadow-none flex justify-center items-center [&>button]:hidden outline-none">
                    <div className="relative inline-flex justify-center">
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