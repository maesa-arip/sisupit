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
            <DialogContent className="p-0 overflow-hidden sm:max-w-md rounded-2xl dark:bg-slate-900 dark:border-slate-800">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800">
                    <DialogTitle className="flex items-center gap-2 text-lg dark:text-slate-100">
                        <Users className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                        Daftar Relawan ({helpers.length})
                    </DialogTitle>
                </DialogHeader>
                
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {helpers.length > 0 ? (
                        <div className="space-y-1">
                            {helpers.map((helper, i) => (
                                <button
                                    key={i}
                                    onClick={() => onSelect(helper)}
                                    className="flex items-center w-full gap-4 p-3 text-left transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 group"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 text-sm font-bold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 shrink-0">
    {helper.user?.name?.[0]?.toUpperCase() ?? '?'}
</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate dark:text-slate-100">
                                            {helper.user?.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Relawan</p>
                                    </div>
                                   <ChevronRight size={18} className="text-gray-400 transition-colors dark:text-slate-500 group-hover:text-amber-500" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-sm text-center text-gray-500 dark:text-slate-400">
                            Tidak ada data relawan.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}