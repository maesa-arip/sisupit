import { Button } from '@/Components/ui/button';
import { startCall, useReporterCall } from '@/lib/reporter-call';
import { IconLoader2, IconPhoneCall } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * "Telepon via Sisupit" (TASK_90) - panggilan suara internet ke pelapor saat nomornya tak bisa
 * dihubungi. Tampil hanya bila prop server `canCallReporter` benar (ReporterCall::canCall).
 */
export default function CallReporterButton({ reportId, className }) {
	const call = useReporterCall();
	const [starting, setStarting] = useState(false);
	const busy = starting || !['idle', 'ended', 'nomic'].includes(call.phase);

	const onClick = async () => {
		setStarting(true);
		try {
			await startCall(reportId);
		} catch (e) {
			toast.error(e.message || 'Panggilan gagal dimulai.');
		} finally {
			setStarting(false);
		}
	};

	return (
		<Button variant="outline" size="sm" className={className ?? 'h-9'} onClick={onClick} disabled={busy}>
			{starting ? (
				<IconLoader2 className="mr-1.5 h-4 w-4 animate-spin" />
			) : (
				<IconPhoneCall className="mr-1.5 h-4 w-4" />
			)}
			Telepon via Sisupit
		</Button>
	);
}
