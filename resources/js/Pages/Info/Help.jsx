import { NOMOR_DARURAT_NASIONAL } from '@/lib/utils';
import { Bullets, Callout, InfoShell, Section, infoLayout } from '@/Pages/Info/Partials/InfoShell';
import { Link } from '@inertiajs/react';
import {
	IconChevronDown,
	IconFlame,
	IconLifebuoy,
	IconMail,
	IconMapPin,
	IconPhoneCall,
	IconPhoto,
	IconSend,
} from '@tabler/icons-react';
import { useState } from 'react';

// Langkah melapor — mengikuti alur form yang sebenarnya (Front/Reports/Create).
const LANGKAH = [
	{
		icon: IconFlame,
		title: 'Pilih jenis kejadian',
		body: 'Buka menu Lapor Darurat, lalu pilih kebakaran atau jenis kedaruratan lain. Pilihan ini menentukan data apa saja yang diminta berikutnya.',
	},
	{
		icon: IconMapPin,
		title: 'Pastikan titik lokasi benar',
		body: 'Aplikasi mengambil titik GPS Anda. Bila penanda meleset, geser penanda di peta tepat ke lokasi kejadian - titik inilah yang menentukan Damkar wilayah mana yang menerima laporan.',
	},
	{
		icon: IconPhoto,
		title: 'Tambahkan foto & keterangan',
		body: 'Foto sangat membantu petugas menilai besaran kejadian sebelum tiba. Tulis keterangan singkat: apa yang terbakar, ada korban atau tidak, akses jalan.',
	},
	{
		icon: IconSend,
		title: 'Kirim & tunggu verifikasi',
		body: 'Laporan masuk ke Pusat Komando untuk diverifikasi. Anda akan menerima pemberitahuan setiap kali statusnya berubah: terverifikasi, dalam penanganan, hingga selesai.',
	},
];

const FAQ_WARGA = [
	{
		q: 'Apakah laporan saya langsung diterima petugas?',
		a: 'Laporan masuk ke antrean Pusat Komando dan diverifikasi lebih dulu agar sumber daya tidak dikerahkan untuk laporan keliru. Anda menerima pemberitahuan begitu status berubah. Bila keadaan mengancam jiwa, tetap telepon nomor darurat - jangan menunggu verifikasi.',
	},
	{
		q: 'Titik lokasi saya meleset jauh. Bagaimana?',
		a: 'Aktifkan GPS/lokasi presisi, lalu tunggu beberapa detik sampai indikator akurasi membaik. Anda juga bisa menggeser penanda di peta secara manual; alamat akan diperbarui otomatis mengikuti penanda.',
	},
	{
		q: 'Saya salah mengirim laporan.',
		a: 'Selama laporan belum diverifikasi, Anda dapat mengubah isinya lewat halaman detail laporan. Bila sudah diverifikasi, segera hubungi nomor kontak instansi agar tidak ada pengerahan yang sia-sia.',
	},
	{
		q: 'Kenapa saya diminta melengkapi wilayah?',
		a: 'Akses data di SISUPIT dibatasi per wilayah. Tanpa data kabupaten/kecamatan/kelurahan, sistem tidak bisa menentukan wilayah Anda sehingga daftar data tampil kosong.',
	},
	{
		q: 'Apakah nomor telepon saya terlihat orang lain?',
		a: 'Tidak. Nomor Anda hanya terlihat oleh petugas berwenang di wilayah kejadian untuk keperluan menghubungi Anda. Rinciannya ada di Kebijakan Privasi.',
	},
];

const FAQ_RELAWAN = [
	{
		q: 'Bagaimana cara menjadi relawan?',
		a: 'Daftar lewat menu relawan pada dashboard, lengkapi profil beserta keahlian Anda. Setelah terdaftar, aktifkan status siaga agar menerima pemberitahuan kejadian di wilayah Anda.',
	},
	{
		q: 'Saya sudah menekan "Meluncur" tapi berhalangan.',
		a: 'Gunakan tombol batal meluncur pada halaman detail kejadian selama Anda belum menandai tiba. Status kejadian akan menyesuaikan sehingga Pusat Komando tahu perlu mencari responder lain.',
	},
	{
		q: 'Kenapa lokasi saya dibagikan saat merespons?',
		a: 'Agar Pusat Komando dapat memantau pergerakan menuju lokasi dan mengoordinasikan bantuan. Perekaman hanya berlangsung selama misi aktif.',
	},
];

const FAQ_PETUGAS = [
	{
		q: 'Saya tidak bisa memverifikasi laporan wilayah lain.',
		a: 'Memang dibatasi. Aksi penanganan hanya berlaku untuk laporan di wilayah kewenangan akun Anda. Bila wilayah akun keliru, minta admin memperbaikinya lewat manajemen pengguna.',
	},
	{
		q: 'Kapan berita acara diisi?',
		a: 'Setelah kejadian ditandai selesai. Entri sementara dapat diisi lebih dulu dari data lapangan, lalu dilengkapi dengan entri final setelah investigasi. Keduanya tersimpan terpisah agar bisa dibandingkan.',
	},
	{
		q: 'Notifikasi kejadian tidak berbunyi di ponsel.',
		a: 'Pastikan aplikasi memiliki izin notifikasi, mode hemat baterai tidak membatasi aplikasi di latar belakang, dan Anda masih masuk pada perangkat tersebut. Keluar dari akun melepas perangkat itu dari daftar penerima.',
	},
];

export default function Help({ instansi, legal }) {
	// 113 = nomor pemadam kebakaran nasional; dipakai sebagai cadangan saat tenant belum
	// mengisi nomornya sendiri. Karena cadangannya bernilai sama, kalimat di bawah menyebut
	// nomor nasional HANYA bila nomor instansi memang berbeda — kalau tidak berbunyi '113 atau 113'.
	const telepon = instansi?.telepon_darurat || NOMOR_DARURAT_NASIONAL;
	const kontakInstansi = instansi?.email_kontak;
	const emailDukungan = legal?.penyedia?.email;

	return (
		<InfoShell
			icon={IconLifebuoy}
			eyebrow="Pusat Bantuan"
			title="Butuh bantuan?"
			subtitle="Panduan singkat memakai SISUPIT, jawaban pertanyaan yang sering muncul, dan ke mana harus menghubungi bila masih tersendat."
		>
			<Callout tone="destructive" title="Sedang menghadapi keadaan darurat?">
				Jangan mencari jawaban di halaman ini. Telepon{' '}
				<a href={`tel:${telepon}`} className="font-bold text-destructive hover:underline">
					{telepon}
				</a>{' '}
				({instansi?.nama_instansi || 'Damkar wilayah Anda'})
				{telepon !== NOMOR_DARURAT_NASIONAL && (
					<>
						{' '}
						atau{' '}
						<a
							href={`tel:${NOMOR_DARURAT_NASIONAL}`}
							className="font-bold text-destructive hover:underline"
						>
							{NOMOR_DARURAT_NASIONAL}
						</a>
					</>
				)}
				, lalu kirim laporan lewat aplikasi setelah keadaan aman.
			</Callout>

			<Section number="1" title="Empat langkah mengirim laporan">
				<div className="grid gap-3 sm:grid-cols-2">
					{LANGKAH.map((langkah, index) => (
						<div key={langkah.title} className="rounded-lg border border-border bg-card p-4">
							<div className="flex items-center gap-2.5">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
									<langkah.icon className="size-5 text-destructive" stroke={1.8} />
								</div>
								<p className="text-sm font-bold text-foreground">
									{index + 1}. {langkah.title}
								</p>
							</div>
							<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{langkah.body}</p>
						</div>
					))}
				</div>
				<div className="pt-1">
					<Link
						href={route('front.reports.create')}
						className="inline-flex h-10 items-center gap-2 rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
					>
						<IconFlame className="size-4" stroke={2.4} />
						Buka Formulir Lapor
					</Link>
				</div>
			</Section>

			<FaqGroup number="2" title="Pertanyaan warga pelapor" items={FAQ_WARGA} />
			<FaqGroup number="3" title="Pertanyaan relawan" items={FAQ_RELAWAN} />
			<FaqGroup number="4" title="Pertanyaan petugas & admin" items={FAQ_PETUGAS} />

			<Section number="5" title="Masalah teknis yang sering terjadi">
				<Bullets
					items={[
						'Peta tidak muncul: periksa koneksi internet, lalu muat ulang halaman. Peta memerlukan data yang diunduh saat halaman dibuka.',
						'Tombol lokasi tidak bekerja: izin lokasi peramban atau aplikasi belum diberikan. Berikan izin lewat pengaturan perangkat, lalu coba lagi.',
						'Foto gagal diunggah: perkecil ukuran foto atau pastikan formatnya JPG/PNG. Sinyal lemah juga membuat unggahan terputus.',
						'Tidak bisa masuk dengan Google: pastikan Anda memilih akun yang benar; bila tetap gagal, gunakan email dan kata sandi.',
						'Lonceng notifikasi tidak bertambah: muat ulang halaman. Pemberitahuan tetap terkirim ke ponsel lewat notifikasi aplikasi.',
					]}
				/>
			</Section>

			<Section number="6" title="Masih perlu bantuan?">
				<div className="grid gap-3 sm:grid-cols-2">
					<div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
						<div className="flex items-center gap-2">
							<IconPhoneCall className="size-4 text-destructive" stroke={2} />
							<p className="text-sm font-bold text-foreground">Keadaan darurat</p>
						</div>
						<a
							href={`tel:${telepon}`}
							className="mt-1.5 block text-base font-bold text-destructive hover:underline"
						>
							{telepon}
						</a>
						<p className="mt-1 text-xs text-muted-foreground">
							Kanal 24 jam {instansi?.nama_instansi || 'Damkar wilayah'}. Nomor pemadam kebakaran
							nasional: {NOMOR_DARURAT_NASIONAL}.
						</p>
					</div>
					<div className="rounded-lg border border-border bg-card p-4">
						<div className="flex items-center gap-2">
							<IconMail className="size-4 text-muted-foreground" stroke={2} />
							<p className="text-sm font-bold text-foreground">Kendala akun & aplikasi</p>
						</div>
						<p className="mt-1.5 text-sm text-muted-foreground">
							{kontakInstansi && (
								<>
									Instansi:{' '}
									<a href={`mailto:${kontakInstansi}`} className="font-semibold text-foreground">
										{kontakInstansi}
									</a>
									<br />
								</>
							)}
							{emailDukungan && (
								<>
									Dukungan teknis:{' '}
									<a href={`mailto:${emailDukungan}`} className="font-semibold text-foreground">
										{emailDukungan}
									</a>
								</>
							)}
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							{legal?.penyedia?.jam_dukungan || 'Jam kerja'} - bukan kanal darurat.
						</p>
					</div>
				</div>
			</Section>
		</InfoShell>
	);
}

/** Kelompok tanya-jawab yang bisa dibuka-tutup. Dibangun dengan state lokal, tanpa dependensi baru. */
function FaqGroup({ number, title, items }) {
	return (
		<Section number={number} title={title}>
			<div className="-mt-1 divide-y divide-border">
				{items.map((item) => (
					<FaqItem key={item.q} question={item.q} answer={item.a} />
				))}
			</div>
		</Section>
	);
}

function FaqItem({ question, answer }) {
	const [open, setOpen] = useState(false);

	return (
		<div className="py-1">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				aria-expanded={open}
				className="flex w-full items-start justify-between gap-3 rounded-md py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-destructive"
			>
				<span className="text-sm font-semibold text-foreground">{question}</span>
				<IconChevronDown
					className={`mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
					stroke={2}
				/>
			</button>
			{open && <p className="pb-3 pr-7 text-sm leading-relaxed text-muted-foreground">{answer}</p>}
		</div>
	);
}

Help.layout = infoLayout('Pusat Bantuan');
