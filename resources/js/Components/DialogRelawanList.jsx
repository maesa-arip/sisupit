import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { ChevronRight, Users } from 'lucide-react';

export default function DialogRelawanList({ open, onClose, helpers = [], onSelect }) {
	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="mb-[80px] w-[95vw] overflow-hidden rounded-xl border border-border bg-card p-0 shadow-sm sm:mb-0 sm:max-w-md">
				<DialogHeader className="border-b border-border px-5 pb-4 pt-5">
					<DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
						<Users className="h-5 w-5 text-muted-foreground" />
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
									className="group flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left outline-none transition-colors hover:border-border hover:bg-accent focus-visible:ring-2 focus-visible:ring-muted-foreground/50"
								>
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-foreground">
										{helper.user?.name?.[0]?.toUpperCase() ?? '?'}
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium text-foreground transition-colors">
											{helper.user?.name}
										</p>
										<p className="mt-0.5 text-[11px] text-muted-foreground">Relawan Merespons</p>
									</div>
									<ChevronRight
										size={16}
										className="text-muted-foreground transition-transform group-hover:translate-x-1"
									/>
								</button>
							))}
						</div>
					) : (
						<div className="py-8 text-center text-sm text-muted-foreground">
							Belum ada relawan yang merespons.
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
