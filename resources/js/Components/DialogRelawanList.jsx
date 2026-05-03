import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ChevronRight, Users } from "lucide-react";

export default function DialogRelawanList({ open, onClose, helpers = [], onSelect }) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            {/* REVISI: Tambahkan mb-[80px] sm:mb-0 agar aman dari Mobile Nav Bottom */}
            <DialogContent className="p-0 overflow-hidden sm:max-w-md w-[95vw] mb-[80px] sm:mb-0 rounded-2xl dark:bg-slate-900 dark:border-slate-800">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800">
                    <DialogTitle className="flex items-center gap-2 text-lg dark:text-slate-100">
                        {/* REVISI: Ikon dikembalikan ke nuansa Biru (konsisten dengan ReportCard) */}
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Daftar Relawan ({helpers.length})
                    </DialogTitle>
                </DialogHeader>
                
                <div className="max-h-[50vh] overflow-y-auto p-2">
                    {helpers.length > 0 ? (
                        <div className="space-y-1">
                            {helpers.map((helper, i) => (
                                <button
                                    key={i}
                                    onClick={() => onSelect(helper)}
                                    className="flex items-center w-full gap-4 p-3 text-left transition-colors outline-none rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 group focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    {/* REVISI: Avatar nuansa biru */}
                                    <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
                                        {helper.user?.name?.[0]?.toUpperCase() ?? '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate transition-colors dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                            {helper.user?.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Relawan Merespons</p>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-400 transition-colors dark:text-slate-500 group-hover:text-blue-500 group-hover:translate-x-1" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-sm text-center text-gray-500 dark:text-slate-400">
                            Belum ada relawan yang merespons.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}