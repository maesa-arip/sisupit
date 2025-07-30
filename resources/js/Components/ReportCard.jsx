import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { IconHeartHandshake, IconSend } from '@tabler/icons-react';
import { AlertTriangle, Clock, MapPin, User, Users } from 'lucide-react';

export default function ReportCard({ report, onHelpClick }) {
    console.log(report)
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${report.location_lat},${report.location_lng}`;
	return (
		<Card className="border shadow-sm rounded-2xl border-muted">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-lg text-destructive">
						<AlertTriangle size={20} /> {report.title}
					</CardTitle>
					{/* <Badge variant="outline">{report.category}</Badge> */}
					<Badge variant="outline">Laporan</Badge>
				</div>
				<CardDescription className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
					<Clock size={14} /> {report.created_at}
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-2 text-sm">
				<div className="flex items-center gap-2 text-muted-foreground">
					<MapPin size={14} /> {report.address}
				</div>

				{report.name && (
					<div className="flex items-center gap-2 text-muted-foreground">
						<User size={14} /> {report.name}
					</div>
				)}

				<p className="text-foreground">{report.description}</p>

				<div className="flex items-center gap-2 pt-2 text-xs italic text-muted-foreground">
					{/* <Users size={14} /> Status bantuan: {report.helpStatus} */}
					<Users size={14} /> Status bantuan: Belum ada relawan
				</div>
				<div className="flex items-center gap-2 pt-2 text-xs italic text-muted-foreground">
					<Card>
						<img className="rounded" src={report.photo} alt="" />
					</Card>
				</div>
			</CardContent>
			<CardFooter>
				<a href={googleMapsUrl} className='w-full' target="_blank" rel="noopener noreferrer">
					<Button className="w-full mr-1">
						<IconSend className="size-4" />
						Lihat di Maps
					</Button>
				</a>
			</CardFooter>

			<CardFooter>
				{/* <Button className="w-full mr-1" onClick={() => onHelpClick(report.id)}>
					<IconDetails className="size-4" />
					Detail
				</Button> */}
				<Button variant="destructive" className="w-full" onClick={() => onHelpClick(report.id)}>
					<IconHeartHandshake className="size-4" />
					Saya Akan Membantu
				</Button>
			</CardFooter>
		</Card>
	);
}
