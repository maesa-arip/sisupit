import { Bullets, DefinitionRow, InfoShell, Section, infoLayout } from '@/Pages/Info/Partials/InfoShell';
import { Link } from '@inertiajs/react';
import { IconInfoCircle } from '@tabler/icons-react';

const ALUR = [
	{ title: 'Warga melapor', body: 'Kejadian dikirim beserta titik GPS dan foto dari lokasi.' },
	{ title: 'Pusat Komando memverifikasi', body: 'Petugas menilai laporan, lalu menyiarkannya ke responder wilayah.' },
	{ title: 'Responder bergerak', body: 'Petugas dan relawan menuju lokasi dengan posisi terpantau di peta.' },
	{ title: 'Kejadian ditutup', body: 'Status diselesaikan, lalu berita acara penanganan disusun sebagai arsip.' },
];

export default function About({ instansi, legal }) {
	const penyelenggara = instansi?.nama_instansi || 'Dinas Pemadam Kebakaran dan Penyelamatan';

	return (
		<InfoShell
			icon={IconInfoCircle}
			eyebrow="Tentang Aplikasi"
			title="Tentang SISUPIT"
			subtitle="Sistem Informasi Kesiapsiagaan untuk Pemadam Kebakaran Terintegrasi - kanal pelaporan dan koordinasi kedaruratan antara warga, Pusat Komando, petugas, dan relawan."
		>
			<Section number="1" title="Bagaimana sistem ini bekerja">
				<div className="grid gap-3 sm:grid-cols-2">
					{ALUR.map((tahap, index) => (
						<div key={tahap.title} className="rounded-lg border border-border bg-card p-4">
							<p className="text-sm font-bold text-foreground">
								{index + 1}. {tahap.title}
							</p>
							<p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tahap.body}</p>
						</div>
					))}
				</div>
			</Section>

			<Section number="2" title="Yang tersedia di dalamnya">
				<Bullets
					items={[
						'Pelaporan kejadian dengan titik GPS presisi, penanda peta yang bisa digeser, dan galeri foto.',
						'Alur verifikasi berjenjang: laporan masuk, terverifikasi, dalam penanganan, selesai, atau ditolak.',
						'Pemantauan posisi responder secara langsung di peta selama misi berjalan.',
						'Peta pemantauan terpadu: kejadian, hidran, pos pemadam, sumur/pompa, dan sebaran relawan.',
						'Berita acara penanganan pasca-kejadian beserta data korban dan dokumentasi.',
						'Pemberitahuan ke ponsel untuk responder dan kabar balik ke pelapor tiap perubahan status.',
						'Pembatasan data per wilayah sehingga tiap instansi hanya melihat wilayah kewenangannya.',
					]}
				/>
			</Section>

			<Section number="3" title="Penyelenggara & versi">
				<div className="rounded-lg border border-border p-4">
					<DefinitionRow label="Instansi penyelenggara" value={penyelenggara} />
					<DefinitionRow label="Wilayah layanan" value={instansi?.subdomain} />
					<DefinitionRow label="Paket layanan" value={instansi?.edition_label} />
					<DefinitionRow label="Telepon darurat" value={instansi?.telepon_darurat} />
					<DefinitionRow label="Pemilik & pengelola sistem" value={legal?.penyedia?.nama} />
					<DefinitionRow label="Dukungan teknis" value={legal?.penyedia?.email} />
					<DefinitionRow label="Versi aplikasi" value={legal?.aplikasi_versi} />
				</div>
				<p>
					Instansi lain yang ingin memakai SISUPIT dapat membaca{' '}
					<Link href={route('info.pricing')} className="font-semibold text-destructive hover:underline">
						Paket &amp; Lisensi
					</Link>
					.
				</p>
			</Section>

			<Section number="4" title="Sumber data peta">
				<p>
					Data peta dasar dan pencarian alamat berasal dari <b>OpenStreetMap</b> beserta kontributornya,
					dilisensikan di bawah Open Database License (ODbL). Penerjemahan koordinat ke alamat dan perhitungan
					rute jalan dijalankan pada layanan milik penyedia sistem yang dibangun dari data OpenStreetMap.
				</p>
				<p className="text-xs">
					© Kontributor OpenStreetMap - data tersedia di bawah ODbL. Tampilan peta dasar disediakan oleh
					penyedia tile yang dikonfigurasikan pada instalasi ini.
				</p>
			</Section>

			<Section number="5" title="Dokumen terkait">
				<Bullets
					items={[
						'Syarat & Ketentuan - hak dan kewajiban saat memakai layanan.',
						'Kebijakan Privasi - data apa yang dikumpulkan dan siapa yang bisa melihatnya.',
						'Pusat Bantuan - panduan pemakaian dan jawaban pertanyaan umum.',
					]}
				/>
			</Section>
		</InfoShell>
	);
}

About.layout = infoLayout('Tentang Aplikasi');
