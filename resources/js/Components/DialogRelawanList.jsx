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
            <DialogContent className="p-0 overflow-hidden sm:max-w-md w-[95vw] mb-[80px] sm:mb-0 rounded-xl bg-white border border-[#e5e5e5] shadow-sm dark:bg-[#151515] dark:border-[#262626]">
                <DialogHeader className="px-5 pt-5 pb-4 border-b border-[#e5e5e5] dark:border-[#262626]">
                    <DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                        <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        Daftar Relawan ({helpers.length})
                    </DialogTitle>
                </DialogHeader>
                
                <div className="max-h-[50vh] overflow-y-auto p-3">
                    {helpers.length > 0 ? (
                        <div className="space-y-1.5">
                            {helpers.map((helper, i) => (
                                <button
                                    key={i}
                                    onClick={() => onSelect(helper)}
                                    className="flex items-center w-full gap-3 p-3 text-left transition-colors outline-none rounded-lg border border-transparent hover:border-[#e5e5e5] hover:bg-gray-50 dark:hover:border-[#333] dark:hover:bg-[#1f1f1f] group focus-visible:ring-2 focus-visible:ring-gray-300"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 text-sm font-semibold text-gray-700 bg-gray-100 border border-[#e5e5e5] rounded-full dark:bg-[#1f1f1f] dark:border-[#262626] dark:text-gray-300 shrink-0">
                                        {helper.user?.name?.[0]?.toUpperCase() ?? '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate transition-colors dark:text-gray-100">
                                            {helper.user?.name}
                                        </p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Relawan Merespons</p>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-400 transition-transform dark:text-gray-500 group-hover:translate-x-1" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-sm text-center text-gray-500 dark:text-gray-400">
                            Belum ada relawan yang merespons.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}