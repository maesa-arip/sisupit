import { Clock, MapPin, Navigation, User, Users, ZoomIn, X, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import DialogRelawanDetail from './DialogRelawanDetail';
import DialogRelawanList from './DialogRelawanList';
import HelpConfirmAlertDialog from './HelpConfirmAlertDialog';
import { Dialog, DialogContent } from '@/Components/ui/dialog';
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
        if (report.status === 'resolved') return { label: 'Selesai', color: 'bg-success/10 text-success border-success/20', icon: <CheckCircle2 size={12} className="mr-1 shrink-0" /> };
        if (report.status === 'handling' || hasHelpers) return { label: 'Penanganan', color: 'bg-info/10 text-info border-info/20', icon: <ShieldAlert size={12} className="mr-1 shrink-0" /> };
        return { label: 'Darurat', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse mr-1.5 shrink-0"></span> };
    };
    const statusConfig = getStatusConfig();

    return (
        <div className="flex flex-col h-full bg-card rounded-xl overflow-hidden border border-border shadow-none hover:border-muted-foreground/50 transition-colors duration-200 group">

            <div className="flex flex-col flex-1 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="flex items-start flex-1 min-w-0 gap-2 text-base font-bold leading-snug text-foreground line-clamp-2">
                        <Flame size={16} className="text-destructive shrink-0 mt-0.5" strokeWidth={2.5} />
                        {report.title}
                    </h2>
                    <span className={cn("shrink-0 flex items-center text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border shadow-none whitespace-nowrap", statusConfig.color)}>
                        {statusConfig.icon}
                        {statusConfig.label}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
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
                    <div className="relative w-full mb-3 overflow-hidden border border-border cursor-pointer h-36 rounded-lg group/img bg-muted shrink-0 shadow-none" onClick={() => setShowImage(true)}>
                        <img src={`/storage/${report.photo}`} alt="Foto laporan" onError={(e) => e.target.src = report.photo} className="object-cover w-full h-full grayscale-[15%] group-hover/img:grayscale-0 transition-all duration-500 group-hover/img:scale-105" />
                        <div className="absolute inset-0 flex items-center justify-center transition-colors duration-300 bg-black/5 group-hover/img:bg-black/30">
                            <div className="flex items-center gap-1.5 p-1.5 px-3 text-foreground transition-all duration-300 transform translate-y-2 rounded-md shadow-none opacity-0 bg-card/95 group-hover/img:opacity-100 backdrop-blur-sm group-hover/img:translate-y-0 border border-border">
                                <ZoomIn size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Perbesar</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-start gap-2 mb-1.5 text-xs font-bold text-muted-foreground">
                    <MapPin size={14} className="text-destructive shrink-0 mt-0.5" />
                    <span className="leading-snug line-clamp-2">{report.address}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                    {report.description || 'Tidak ada deskripsi rinci.'}
                </p>
            </div>

            <div className="px-4 pb-4 mt-auto border-t border-border pt-3 bg-muted/50">

                {hasHelpers ? (
                    <button
                        type="button"
                        className="flex items-center justify-between w-full mb-3 text-[11px] font-bold transition-colors text-foreground hover:text-destructive outline-none group/helper"
                        onClick={() => setShowList(true)}
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="flex -space-x-1.5">
                                {report.helpers.slice(0, 3).map((h, i) => (
                                    <div key={i} className="flex items-center justify-center w-5 h-5 text-[8px] font-bold text-primary-foreground border border-card rounded-full bg-foreground/90 shadow-none transition-colors group-hover/helper:bg-destructive">
                                        {h.user?.name?.[0]?.toUpperCase() ?? '?'}
                                    </div>
                                ))}
                            </div>
                            <span>{report.helpers.length} Relawan Merespons</span>
                        </div>
                        <span className="text-base leading-none">›</span>
                    </button>
                ) : (
                    <div className="flex items-center w-full gap-1.5 mb-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <Users size={12} /> Belum Ada Responden
                    </div>
                )}

                {/* 👇 FIX: TOMBOL EKSTRA KOMPAK (h-8 atau 32px) 👇 */}
                <div className="flex items-stretch gap-2">
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex-none outline-none">
                        <button type="button" className="flex items-center justify-center w-8 h-8 transition-colors bg-card border border-border rounded-md shadow-none text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-muted-foreground/50">
                            <Navigation size={14} strokeWidth={2.5} />
                        </button>
                    </a>

                    <div className="flex-1">
                        {isOwner ? (
                            <Link href={route('reports.show', report.id)} className="flex items-center justify-center w-full h-8 text-[10px] font-bold text-foreground uppercase tracking-wider transition-colors bg-card border border-border rounded-md shadow-none hover:bg-accent">
                                Pantau Laporan
                            </Link>
                        ) : isMyTask ? (
                            <Link href={route('reports.show', report.id)} className="flex items-center justify-center w-full h-8 text-[10px] font-bold text-primary-foreground uppercase tracking-wider transition-colors bg-foreground border border-transparent rounded-md shadow-none hover:bg-foreground/90">
                                Peta Operasional
                            </Link>
                        ) : report.status === 'resolved' ? (
                            <button disabled type="button" className="flex items-center justify-center w-full h-8 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider transition-colors bg-muted border border-border rounded-md cursor-not-allowed shadow-none">
                                Kasus Selesai
                            </button>
                        ) : isRelawan ? (
                            <HelpConfirmAlertDialog
                                reportId={report.id}
                                className="flex items-center justify-center w-full h-8 text-[10px] font-bold text-destructive-foreground uppercase tracking-wider transition-colors bg-destructive hover:bg-destructive/90 rounded-md shadow-none border border-destructive focus:ring-2 focus:ring-destructive/50 outline-none"
                                onSuccess={onSuccess}
                            />
                        ) : (
                            <button disabled type="button" className="flex items-center justify-center w-full h-8 text-[10px] font-bold text-muted-foreground uppercase tracking-wider transition-colors bg-muted border border-border rounded-md cursor-not-allowed shadow-none">
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
                        <button onClick={() => setShowImage(false)} className="absolute z-50 flex items-center justify-center w-10 h-10 text-foreground bg-card hover:bg-accent rounded-full top-2 right-2 border border-border transition-colors shadow-none outline-none">
                            <X size={20} />
                        </button>
                        <img src={`/storage/${report.photo}`} onError={(e) => e.target.src = report.photo} alt="Foto kejadian detail" className="w-auto h-auto max-w-[100vw] max-h-[90vh] object-contain rounded-md shadow-none border border-border bg-black/20" />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}