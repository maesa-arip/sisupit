import { Bullets, Callout, DefinitionRow, InfoShell, Section, infoLayout } from '@/Pages/Info/Partials/InfoShell';
import { Link } from '@inertiajs/react';
import { IconShieldLock } from '@tabler/icons-react';

const formatTanggal = (value) => {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

export default function Privacy({ instansi, legal }) {
	const penyelenggara = instansi?.nama_instansi || 'Dinas Pemadam Kebakaran dan Penyelamatan';
	const penyedia = legal?.penyedia?.nama || 'Pengembang SISUPIT';
	const kontak = instansi?.email_kontak || legal?.penyedia?.email;
	const retensi = legal?.retensi_bulan || 24;

	return (
		<InfoShell
			icon={IconShieldLock}
			eyebrow={`Versi ${legal?.dokumen?.privasi_versi || '1.0'} — berlaku sejak ${formatTanggal(legal?.dokumen?.privasi_berlaku)}`}
			title="Kebijakan Privasi"
			subtitle="Data apa yang dikumpulkan saat Anda memakai SISUPIT, untuk apa dipakai, siapa yang bisa melihatnya, dan hak Anda atas data itu."
			footerNote="Kebijakan ini menjelaskan praktik yang benar-benar berjalan di sistem, bukan pernyataan umum. Bila fitur berubah dan memengaruhi pemrosesan data, dokumen ini diperbarui beserta versinya."
		>
			<Callout tone="info" title="Ringkasnya">
				Kami mengumpulkan lokasi dan identitas Anda hanya sejauh yang diperlukan untuk mengirim pertolongan ke
				tempat yang benar. Data tidak dijual dan tidak dipakai untuk iklan. Foto KTP korban pada berita acara
				disimpan di penyimpanan tertutup yang tidak bisa diakses lewat tautan publik.
			</Callout>

			<Section number="1" title="Siapa yang bertanggung jawab atas data Anda">
				<p>
					<b>{penyelenggara}</b> adalah pihak yang menentukan tujuan pemakaian data (pengendali data).{' '}
					<b>{penyedia}</b> mengoperasikan sistem atas nama instansi dan hanya memproses data sesuai kebutuhan
					teknis (pemroses data).
				</p>
				<div className="mt-3 rounded-lg border border-border p-4">
					<DefinitionRow label="Instansi penyelenggara" value={penyelenggara} />
					<DefinitionRow label="Alamat" value={instansi?.alamat_instansi} />
					<DefinitionRow label="Penanggung jawab data" value={instansi?.penanggung_jawab_data} />
					<DefinitionRow label="Kontak pengaduan data" value={kontak} />
					<DefinitionRow label="Telepon darurat wilayah" value={instansi?.telepon_darurat} />
				</div>
			</Section>

			<Section number="2" title="Data yang dikumpulkan">
				<p className="font-semibold text-foreground">Dari semua pengguna:</p>
				<Bullets
					items={[
						'Identitas akun: nama, nama pengguna, email, nomor telepon, jenis kelamin, dan foto profil bila diisi.',
						'Wilayah administratif: provinsi, kabupaten/kota, kecamatan, dan kelurahan/desa — dipakai untuk membatasi akses data per wilayah.',
						'Data akun Google (nama, email, foto) bila Anda masuk memakai Google.',
						'Token perangkat untuk notifikasi, agar pemberitahuan kejadian sampai ke ponsel Anda.',
						'Catatan teknis: waktu akses dan aktivitas dalam sistem.',
					]}
				/>
				<p className="mt-4 font-semibold text-foreground">Saat Anda mengirim laporan:</p>
				<Bullets
					items={[
						'Titik koordinat lokasi kejadian (dari GPS perangkat atau pin yang Anda geser di peta) beserta alamat hasil penerjemahan koordinat.',
						'Keterangan kejadian dan foto yang Anda unggah.',
						'Waktu pelaporan dan riwayat perubahan status laporan.',
					]}
				/>
				<p className="mt-4 font-semibold text-foreground">Khusus petugas & relawan yang merespons:</p>
				<Bullets
					items={[
						'Lokasi berkala selama perjalanan menuju lokasi kejadian, agar Pusat Komando dapat memantau pergerakan dan mengoordinasikan bantuan. Perekaman berlangsung selama misi aktif.',
						'Riwayat keikutsertaan pada kejadian: waktu berangkat, tiba, dan selesai.',
					]}
				/>
				<p className="mt-4 font-semibold text-foreground">Pada berita acara penanganan (diisi petugas):</p>
				<Bullets
					items={[
						'Identitas korban/pemilik objek terdampak, termasuk foto KTP bila diperlukan untuk keperluan administrasi.',
						'Kronologi, taksiran kerugian, dan foto dokumentasi kejadian.',
					]}
				/>
			</Section>

			<Section number="3" title="Untuk apa data dipakai">
				<Bullets
					items={[
						'Mengirim petugas/relawan ke lokasi yang benar dan menghubungi pelapor bila keterangan kurang jelas.',
						'Memberi tahu warga di sekitar wilayah kejadian serta memberi kabar balik ke pelapor setiap kali status laporannya berubah.',
						'Menyusun berita acara dan dokumentasi resmi pasca-kejadian.',
						'Menyusun rekapitulasi dan statistik wilayah yang dipakai instansi untuk perencanaan — dalam bentuk angka gabungan, tanpa identitas perorangan.',
					]}
				/>
				<p>
					Data <b>tidak</b> dijual, tidak dipertukarkan untuk kepentingan komersial, dan tidak dipakai untuk
					iklan.
				</p>
			</Section>

			<Section number="4" title="Siapa yang bisa melihat apa">
				<Bullets
					items={[
						'Warga pelapor hanya dapat melihat laporannya sendiri beserta perkembangan statusnya.',
						'Petugas, admin, dan pejabat pemantau hanya melihat data pada wilayah kewenangannya — pembatasan ini berlaku di lapisan basis data, bukan sekadar tampilan.',
						'Relawan melihat kejadian di area penugasannya dan kejadian yang ia ikuti.',
						'Foto KTP korban disimpan pada penyimpanan tertutup dan hanya dapat dibuka lewat jalur berizin oleh petugas berwenang di wilayah tersebut; tidak ada tautan publik ke berkas tersebut.',
						'Superadmin sistem memiliki akses lintas wilayah untuk keperluan pemeliharaan.',
					]}
				/>
			</Section>

			<Section number="5" title="Pihak ketiga yang terlibat">
				<Bullets
					items={[
						'Layanan notifikasi Google Firebase Cloud Messaging: menerima token perangkat dan isi pemberitahuan agar notifikasi sampai ke ponsel.',
						'Masuk dengan Google: memverifikasi identitas akun Google Anda bila Anda memilih cara masuk ini.',
						'Penyedia peta dasar: peramban Anda mengunduh gambar peta dari server peta, sehingga area peta yang Anda buka diketahui penyedia tersebut.',
						'Penerjemahan koordinat ke alamat dan perhitungan rute jalan dilakukan lewat layanan yang dijalankan sendiri oleh penyedia sistem, bukan dikirim ke layanan publik pihak ketiga.',
					]}
				/>
			</Section>

			<Section number="6" title="Penyimpanan & lama simpan">
				<Bullets
					items={[
						`Data kejadian dan dokumen penanganan disimpan sekurang-kurangnya ${retensi} bulan sebagai arsip operasional instansi, atau lebih lama bila ketentuan kearsipan mensyaratkan.`,
						'Riwayat lokasi responder disimpan sebagai bagian dari catatan misi dan tidak dipakai untuk memantau pergerakan di luar misi.',
						'Data disimpan pada server yang dikelola penyedia sistem dengan akses terbatas pada pengelola yang berwenang.',
					]}
				/>
			</Section>

			<Section number="7" title="Pengamanan">
				<Bullets
					items={[
						'Sambungan aplikasi memakai enkripsi transport (HTTPS).',
						'Kata sandi disimpan dalam bentuk teracak satu arah, tidak dapat dibaca kembali.',
						'Akses data dibatasi berdasarkan peran dan wilayah; berkas identitas korban berada di penyimpanan tertutup.',
						'Tidak ada sistem yang sepenuhnya kebal. Bila terjadi insiden yang berdampak pada data Anda, instansi akan memberi tahu sesuai ketentuan yang berlaku.',
					]}
				/>
			</Section>

			<Section number="8" title="Hak Anda">
				<Bullets
					items={[
						'Melihat dan memperbaiki data akun Anda sendiri lewat halaman Profil.',
						'Meminta salinan data Anda yang tersimpan pada sistem.',
						'Meminta penghapusan akun. Data yang telah menjadi bagian dokumen penanganan resmi tetap diarsipkan instansi sesuai ketentuan kearsipan.',
						'Menarik izin lokasi atau notifikasi lewat pengaturan perangkat — sebagian fitur pelaporan akan berkurang ketepatannya.',
					]}
				/>
				<p>
					Ajukan permintaan tersebut ke {kontak || 'kanal kontak instansi'}. Baca juga{' '}
					<Link href={route('info.terms')} className="font-semibold text-destructive hover:underline">
						Syarat &amp; Ketentuan
					</Link>{' '}
					untuk kewajiban yang menyertainya.
				</p>
			</Section>

			<Section number="9" title="Perubahan kebijakan">
				<p>
					Bila terjadi perubahan pada jenis data yang dikumpulkan atau cara pemakaiannya, versi dan tanggal
					berlaku di bagian atas halaman ini akan diperbarui.
				</p>
			</Section>
		</InfoShell>
	);
}

Privacy.layout = infoLayout('Kebijakan Privasi');
