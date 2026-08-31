import { Bullets, Callout, InfoShell, Section, infoLayout } from '@/Pages/Info/Partials/InfoShell';
import { IconBuildingCommunity, IconCheck, IconLicense, IconMail } from '@tabler/icons-react';

// Isi tiap paket. Ringkasan hak pakai datang dari enum TenantEdition di server
// (`description`), rincian di bawah ini menerjemahkannya jadi butir yang bisa dibandingkan.
const RINCIAN = {
	sewa: [
		'Hak pakai penuh selama masa berlangganan aktif',
		'Pemeliharaan, pembaruan fitur, dan perbaikan termasuk',
		'Dukungan teknis pada jam layanan yang disepakati',
		'Subdomain sendiri beserta branding instansi',
		'Kode sumber tetap milik pengembang',
		'Biaya berulang, tanpa investasi awal besar',
	],
	beli: [
		'Lisensi perpetual - hak pakai selamanya, tanpa biaya sewa',
		'Salinan kode sumber diserahkan sebagai aset instansi',
		'Subdomain sendiri beserta branding instansi',
		'Halaman dan modul khusus sesuai kebutuhan daerah dimungkinkan',
		'Hosting tetap dikelola bersama pada infrastruktur yang sama',
		'Pemeliharaan lanjutan dan pembaruan diatur terpisah',
	],
};

export default function Pricing({ instansi, legal, editions }) {
	const penyedia = legal?.penyedia?.nama || 'Pengembang SISUPIT';
	const email = legal?.penyedia?.email;

	return (
		<InfoShell
			icon={IconLicense}
			eyebrow="Untuk Pemerintah Daerah"
			title="Paket & Lisensi"
			subtitle="SISUPIT dapat dipakai kabupaten/kota lain dengan dua skema: menyewa sebagai layanan, atau membeli lisensi perpetual beserta kode sumbernya."
			footerNote="Halaman ini menjelaskan skema layanan, bukan penawaran harga. Besaran biaya, jangka waktu, dan tingkat layanan mengikuti dokumen penawaran resmi serta Perjanjian Kerja Sama yang ditandatangani kedua pihak."
		>
			<div className="grid gap-4 sm:grid-cols-2">
				{(editions ?? []).map((edition) => (
					<div
						key={edition.value}
						className={`rounded-xl border p-5 shadow-sm ${
							instansi?.edition === edition.value
								? 'border-destructive/50 bg-destructive/5'
								: 'border-border bg-card'
						}`}
					>
						<div className="flex items-start justify-between gap-2">
							<h2 className="text-sm font-bold text-foreground">{edition.label}</h2>
							{instansi?.edition === edition.value && (
								<span className="whitespace-nowrap rounded-md border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
									Paket wilayah ini
								</span>
							)}
						</div>
						<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{edition.description}</p>
						<ul className="mt-4 space-y-2">
							{(RINCIAN[edition.value] ?? []).map((butir) => (
								<li key={butir} className="flex gap-2.5 text-sm text-muted-foreground">
									<IconCheck className="mt-0.5 size-4 shrink-0 text-destructive" stroke={2.4} />
									<span>{butir}</span>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>

			<Section number="1" title="Yang berlaku sama di kedua paket">
				<Bullets
					items={[
						'Data kejadian adalah milik instansi, bukan milik pengembang - pada skema sewa maupun beli.',
						'Hak eksit: data satu kabupaten dapat diekstrak utuh dan terpisah kapan pun diminta, sehingga instansi tidak terkunci pada penyedia.',
						'Isolasi data antar kabupaten berlaku di lapisan basis data, bukan sekadar tampilan.',
						'Identitas publik instansi (nama dinas, pejabat, nomor darurat) dikelola sendiri lewat panel administrasi.',
						'Pembaruan keamanan dikerjakan satu kali untuk semua kabupaten, sehingga tidak ada daerah yang tertinggal versi.',
					]}
				/>
			</Section>

			<Section number="2" title="Bagaimana penambahan kabupaten baru">
				<p>
					Kabupaten/kota baru cukup didaftarkan pada panel administrasi: subdomain, identitas dinas, pejabat,
					dan nomor darurat. Sejak saat itu wilayah tersebut punya wajah publiknya sendiri, dan seluruh data
					laporannya terpisah dari daerah lain - tanpa perlu pemasangan sistem baru.
				</p>
				<Callout tone="info" title="Catatan teknis">
					Semua kabupaten berjalan pada satu sistem yang sama. Perbedaan tampilan dan modul per daerah
					disediakan lewat titik penyesuaian resmi di dalam sistem, sehingga lapisan keamanan dan pembatasan
					wilayah tetap satu dan tidak tergandakan.
				</Callout>
			</Section>

			<Section number="3" title="Cakupan dukungan">
				<Bullets
					items={[
						`Dukungan teknis dilayani pada ${legal?.penyedia?.jam_dukungan || 'jam kerja yang disepakati'}.`,
						'Tingkat layanan (SLA) mengikuti lampiran perjanjian: waktu tanggap dibedakan menurut tingkat gangguan.',
						'Pelatihan pengguna dan pendampingan awal dilakukan pada masa onboarding.',
						'Layanan peta dan pencarian alamat dijalankan sendiri oleh penyedia sistem sehingga tidak bergantung pada kuota layanan publik.',
					]}
				/>
			</Section>

			<Section number="4" title="Langkah berikutnya">
				<p>
					Sampaikan kebutuhan daerah Anda - jumlah pos, perkiraan volume kejadian, dan skema yang diminati -
					untuk kami tindak lanjuti dengan penawaran resmi beserta rancangan Perjanjian Kerja Sama.
				</p>
				<div className="mt-2 grid gap-3 sm:grid-cols-2">
					<div className="rounded-lg border border-border bg-card p-4">
						<div className="flex items-center gap-2">
							<IconMail className="size-4 text-muted-foreground" stroke={2} />
							<p className="text-sm font-bold text-foreground">Kontak penyedia sistem</p>
						</div>
						<p className="mt-1.5 text-sm text-muted-foreground">
							{penyedia}
							{email && (
								<>
									<br />
									<a href={`mailto:${email}`} className="font-semibold text-foreground">
										{email}
									</a>
								</>
							)}
						</p>
					</div>
					<div className="rounded-lg border border-border bg-card p-4">
						<div className="flex items-center gap-2">
							<IconBuildingCommunity className="size-4 text-muted-foreground" stroke={2} />
							<p className="text-sm font-bold text-foreground">Sudah berjalan di</p>
						</div>
						<p className="mt-1.5 text-sm text-muted-foreground">
							{instansi?.nama_instansi || 'Damkar kabupaten/kota di Bali'} - beserta kabupaten lain yang
							bergabung pada sistem yang sama.
						</p>
					</div>
				</div>
			</Section>
		</InfoShell>
	);
}

Pricing.layout = infoLayout('Paket & Lisensi');
