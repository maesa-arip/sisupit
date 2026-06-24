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
            <DialogContent className="p-0 overflow-hidden sm:max-w-md w-[95vw] mb-[80px] sm:mb-0 rounded-xl bg-card border border-border shadow-sm">
                <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
                    <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                        <Users className="w-5 h-5 text-muted-foreground" />
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
                                    className="flex items-center w-full gap-3 p-3 text-left transition-colors outline-none rounded-lg border border-transparent hover:border-border hover:bg-accent group focus-visible:ring-2 focus-visible:ring-muted-foreground/50"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 text-sm font-semibold text-foreground bg-muted border border-border rounded-full shrink-0">
                                        {helper.user?.name?.[0]?.toUpperCase() ?? '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate transition-colors">
                                            {helper.user?.name}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">Relawan Merespons</p>
                                    </div>
                                    <ChevronRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-1" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-sm text-center text-muted-foreground">
                            Belum ada relawan yang merespons.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}