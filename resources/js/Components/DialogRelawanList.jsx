import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DialogRelawanList({ open, onClose, helpers, onSelect }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Daftar Relawan</DialogTitle>
        </DialogHeader>
        <ul className="mt-2 space-y-2">
          {helpers.map((helper, i) => (
            <li
              key={i}
              onClick={() => onSelect(helper)}
              className="cursor-pointer hover:text-blue-600"
            >
              {helper.user?.name}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
