import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Bullets, Callout, InfoShell, Section, infoLayout } from '@/Pages/Info/Partials/InfoShell';
import { Link } from '@inertiajs/react';
import { IconBuildingBank, IconGavel, IconUser } from '@tabler/icons-react';

const formatTanggal = (value) => {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

const tabTriggerClass =
	'flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm';

/**
 * Syarat & Ketentuan. Dua dokumen dalam satu halaman bertab karena audiensnya berbeda:
 *   - Tab "Pengguna Umum"      → warga, petugas, relawan yang memakai aplikasi.
 *   - Tab "Pengguna Berkontrak" → instansi/entitas yang terikat PKS dengan penyedia.
 * Klausul di tab kedua TIDAK mengikat pengguna umum, dan sebaliknya.
 */
export default function Terms({ instansi, legal }) {
	const penyelenggara = instansi?.nama_instansi || 'Dinas Pemadam Kebakaran dan Penyelamatan';
	const penyedia = legal?.penyedia?.nama || 'PT Tawarin Dimana Aja';
	const telepon = instansi?.telepon_darurat || '112';
	const kontak = instansi?.email_kontak || legal?.penyedia?.email;
	const emailLegal = legal?.penyedia?.email_legal;
	const alamatPenyedia = legal?.penyedia?.alamat;
	const isBeli = instansi?.edition === 'beli';

	return (
		<InfoShell
			icon={IconGavel}
			eyebrow={`Versi ${legal?.dokumen?.syarat_versi || '1.0'} — berlaku sejak ${formatTanggal(legal?.dokumen?.syarat_berlaku)}`}
			title="Syarat & Ketentuan"
			subtitle={`Ketentuan penggunaan SISUPIT di wilayah layanan ${penyelenggara}.`}
			footerNote={`Dokumen ini ditulis dalam Bahasa Indonesia dan tunduk pada hukum Republik Indonesia. Jika Anda menemukan bagian yang tidak jelas, hubungi ${kontak || penyelenggara} sebelum menggunakan layanan.`}
		>
			<Callout tone="destructive" title="Bacalah bagian ini lebih dulu">
				SISUPIT adalah kanal pelaporan <b>pendukung</b>, bukan pengganti panggilan darurat. Bila jaringan
				bermasalah, aplikasi tidak terbuka, atau keadaan mengancam jiwa, segera telepon{' '}
				<a href={`tel:${telepon}`} className="font-bold text-destructive hover:underline">
					{telepon}
				</a>{' '}
				atau <b>112</b>.
			</Callout>

			<Tabs defaultValue="umum" className="w-full">
				<TabsList className="grid h-fit w-full grid-cols-2 rounded-lg border border-border bg-muted p-1">
					<TabsTrigger value="umum" className={tabTriggerClass}>
						<IconUser size={16} /> Pengguna Umum
					</TabsTrigger>
					<TabsTrigger value="berkontrak" className={tabTriggerClass}>
						<IconBuildingBank size={16} /> Pengguna Berkontrak
					</TabsTrigger>
				</TabsList>

				{/* ------------------------------ TAB A: PENGGUNA UMUM ------------------------------ */}
				<TabsContent value="umum" className="mt-4 space-y-4 outline-none focus-visible:ring-0">
					<Section number="1" title="Siapa penyelenggara layanan ini">
						<p>
							Layanan SISUPIT di wilayah ini diselenggarakan oleh <b>{penyelenggara}</b> sebagai instansi
							yang menerima, memverifikasi, dan menindaklanjuti laporan. Aplikasinya dimiliki,
							dikembangkan, dan dioperasikan secara teknis oleh <b>{penyedia}</b>.
						</p>
						<p>
							Dengan mendaftar, mengakses, atau menggunakan aplikasi ini, Anda menyatakan telah membaca,
							memahami, dan menyetujui untuk terikat oleh Ketentuan ini beserta{' '}
							<Link
								href={route('info.privacy')}
								className="font-semibold text-destructive hover:underline"
							>
								Kebijakan Privasi
							</Link>
							. Jika Anda tidak menyetujui sebagian atau seluruh ketentuan ini, Anda tidak diperkenankan
							menggunakan aplikasi.
						</p>
					</Section>

					<Section number="2" title="Definisi">
						<Bullets
							items={[
								'"Aplikasi" atau "SISUPIT" adalah platform digital pelaporan dan koordinasi kedaruratan, mencakup aplikasi mobile, web, API, sistem backend, dan seluruh fitur di dalamnya.',
								`"${penyedia}" adalah badan hukum perseroan terbatas yang sah menurut hukum Republik Indonesia selaku pemilik dan pengelola resmi Aplikasi.`,
								`"Instansi" atau "Penyelenggara" adalah ${penyelenggara}, yaitu instansi pemerintah yang menyelenggarakan layanan kedaruratan di wilayah ini dan menjadi pengendali data laporan warga.`,
								'"Pengguna" adalah setiap orang yang mengunduh, mengakses, mendaftar, atau menggunakan layanan di dalam Aplikasi — termasuk warga pelapor, petugas, dan relawan.',
								'"Konten" meliputi seluruh teks, grafis, gambar, data, informasi, logo, ikon, perangkat lunak, audio, video, dan materi lain yang tersedia di dalam Aplikasi.',
							]}
						/>
					</Section>

					<Section number="3" title="Kelayakan pengguna">
						<p>Dengan menggunakan Aplikasi, Anda menyatakan dan menjamin bahwa:</p>
						<Bullets
							items={[
								'Anda berusia minimal 17 tahun atau telah dianggap dewasa secara hukum menurut hukum Republik Indonesia, atau memiliki izin sah dari orang tua/wali.',
								'Anda memiliki kapasitas hukum yang sah untuk mengikatkan diri dalam Ketentuan ini.',
								'Seluruh informasi yang Anda berikan saat pendaftaran maupun penggunaan lanjutan adalah akurat, benar, terkini, dan lengkap.',
							]}
						/>
						<p className="text-xs">
							Batas usia ini tidak menghalangi siapa pun melaporkan keadaan darurat lewat telepon{' '}
							<b>{telepon}</b> atau <b>112</b>.
						</p>
					</Section>

					<Section number="4" title="Akun pengguna">
						<Bullets
							items={[
								'Akun dibuat dengan data yang benar. Nama, nomor telepon, dan wilayah dipakai petugas untuk menghubungi Anda saat kejadian — data palsu memperlambat pertolongan.',
								'Akun bersifat pribadi. Jangan bagikan akses akun Anda kepada orang lain. Seluruh aktivitas yang terjadi lewat akun Anda menjadi tanggung jawab Anda.',
								'Melengkapi wilayah (kabupaten/kecamatan/kelurahan) diwajibkan sebelum memakai fitur berdata, karena akses data dibatasi per wilayah.',
								'Instansi berhak menangguhkan akun yang dipakai menyalahi ketentuan ini.',
							]}
						/>
					</Section>

					<Section number="5" title="Kewajiban saat melapor">
						<Bullets
							items={[
								'Laporkan hanya kejadian yang benar-benar terjadi, dengan titik lokasi seakurat mungkin.',
								'Laporan palsu, iseng, atau berulang tanpa dasar menghambat penanganan kejadian nyata dan dapat berujung pada penangguhan akun serta proses hukum sesuai peraturan yang berlaku.',
								'Foto yang Anda unggah harus terkait kejadian dan tidak melanggar hak orang lain.',
								'Jika Anda salah mengirim laporan, sampaikan segera lewat kanal kontak instansi agar sumber daya tidak dikerahkan sia-sia.',
							]}
						/>
					</Section>

					<Section number="6" title="Ketentuan bagi petugas & relawan">
						<Bullets
							items={[
								'Data laporan memuat identitas, nomor telepon, dan lokasi warga. Data itu hanya boleh dipakai untuk penanganan kejadian — dilarang disebarkan, disalin ke luar sistem, atau dipakai untuk keperluan pribadi.',
								'Berbagi lokasi saat merespons kejadian dilakukan agar Pusat Komando dapat mengoordinasikan bantuan; lokasi direkam selama misi berlangsung.',
								'Relawan bekerja pada wilayah penugasannya. Bergabung ke sebuah kejadian berarti bersedia mengikuti arahan petugas di lokasi.',
								'Penyalahgunaan akses data dapat berakibat pencabutan peran dan tindakan sesuai ketentuan kepegawaian/kerelawanan yang berlaku.',
							]}
						/>
					</Section>

					<Section number="7" title="Larangan keras">
						<p>Pengguna dilarang keras menggunakan Aplikasi untuk melakukan tindakan berikut:</p>
						<Bullets
							items={[
								'Pelanggaran hukum: memakai Aplikasi untuk tujuan apa pun yang melanggar hukum, undang-undang, atau peraturan yang berlaku di tingkat lokal, nasional, maupun internasional.',
								'Rekayasa balik & akses tidak sah: melakukan reverse engineering, dekompilasi, pembongkaran, atau mencoba memperoleh akses tidak sah ke kode sumber, server, basis data, atau sistem keamanan Aplikasi.',
								'Penyebaran kode berbahaya: mengunggah atau menyebarkan virus, malware, spyware, atau kode lain yang dapat merusak fungsi Aplikasi maupun infrastruktur sistem.',
								`Pencurian identitas & penipuan: menyamar sebagai orang atau entitas lain, memberikan informasi palsu, atau melakukan pemalsuan identitas dalam bentuk apa pun — termasuk mengaku sebagai petugas ${penyelenggara}.`,
								`Aktivitas komersial tanpa izin: memakai Aplikasi untuk kepentingan komersial pihak ketiga atau mengeruk data (scraping) tanpa izin tertulis dari ${penyedia}.`,
								'Pembebanan sistem: membebani infrastruktur server melebihi batas wajar, termasuk melalui bot, spider, atau serangan penolakan layanan.',
								`Pelanggaran hak kekayaan intelektual: menyalin, mendistribusikan, memodifikasi, atau mengeksploitasi kekayaan intelektual milik ${penyedia} tanpa izin resmi.`,
							]}
						/>
					</Section>

					<Section number="8" title="Konten yang Anda unggah">
						<p>
							Foto, keterangan, dan dokumen yang Anda kirim tetap milik Anda. Dengan mengirimkannya, Anda
							memberi izin kepada {penyelenggara} untuk menyimpan dan memakainya sebatas keperluan
							penanganan kejadian, dokumentasi berita acara, serta rekapitulasi statistik yang tidak
							mengidentifikasi perorangan.
						</p>
					</Section>

					<Section number="9" title="Hak kekayaan intelektual atas Aplikasi">
						<p>
							Seluruh hak cipta, merek dagang, desain, paten, rahasia dagang, dan hak kekayaan intelektual
							lain yang melekat pada Aplikasi SISUPIT — termasuk namun tidak terbatas pada logo, teks,
							grafis, kode perangkat lunak, dan tata letak — sepenuhnya milik sah {penyedia} atau telah
							memperoleh lisensi yang sah. Penggunaan Aplikasi tidak memberikan hak kepemilikan apa pun
							kepada Pengguna atas kekayaan intelektual tersebut.
						</p>
						<p className="text-xs">
							Ketentuan ini menyangkut <b>perangkat lunaknya</b>, bukan data laporan. Kepemilikan data
							kejadian diatur pada bagian 12.
						</p>
					</Section>

					<Section number="10" title="Ketersediaan layanan & batas tanggung jawab">
						<Bullets
							items={[
								'Aplikasi disediakan berdasarkan ketersediaan "sebagaimana adanya" (as is) dan "sebagaimana tersedia". Tidak ada jaminan bahwa Aplikasi akan selalu bebas gangguan, bebas dari kesalahan, atau bebas dari virus.',
								'Layanan diupayakan tersedia setiap saat, namun dapat terganggu oleh pemeliharaan, gangguan jaringan, keadaan kahar (force majeure), atau keterbatasan perangkat pengguna.',
								`Dukungan teknis dilayani pada ${legal?.penyedia?.jam_dukungan || 'jam kerja'}. Kanal dukungan BUKAN kanal darurat.`,
								'Penyelenggara dan penyedia tidak bertanggung jawab atas kerugian yang timbul karena keterlambatan yang disebabkan data laporan yang keliru, lokasi yang tidak akurat, atau kegagalan jaringan di luar kendali sistem.',
								'Dalam batas maksimal yang diizinkan hukum yang berlaku, penyedia beserta afiliasi, direktur, karyawan, dan agennya tidak bertanggung jawab atas kerugian tidak langsung, insidental, khusus, punitif, atau konsekuensial (termasuk kehilangan keuntungan, kehilangan data, atau gangguan usaha) yang timbul dari penggunaan atau ketidakmampuan menggunakan Aplikasi.',
								'Ketepatan waktu tanggap tetap mengikuti ketentuan operasional instansi, bukan janji aplikasi.',
							]}
						/>
					</Section>

					<Section number="11" title="Ganti rugi">
						<p>
							Pengguna setuju untuk membela, membebaskan, dan melindungi {penyedia} beserta pengurus,
							karyawan, mitra, dan afiliasinya dari dan terhadap setiap klaim, tuntutan, kerugian,
							kewajiban, biaya, atau pengeluaran (termasuk biaya hukum yang wajar) yang timbul akibat:
						</p>
						<Bullets
							items={[
								'pelanggaran yang Anda lakukan terhadap Syarat dan Ketentuan ini;',
								'penyalahgunaan Aplikasi oleh Anda; atau',
								'pelanggaran yang Anda lakukan terhadap hak pihak ketiga mana pun, termasuk hak kekayaan intelektual maupun hak privasi.',
							]}
						/>
					</Section>

					<Section number="12" title="Kepemilikan data & lisensi sistem">
						<p>
							<b>Data kejadian adalah milik {penyelenggara}.</b> Instansi berhak memperoleh salinan
							datanya secara utuh kapan pun diminta, termasuk bila kerja sama berakhir.
						</p>
						<div className="rounded-lg border border-border bg-accent/40 p-4">
							<p className="text-xs font-bold uppercase tracking-wide text-destructive">
								Paket layanan wilayah ini: {instansi?.edition_label || 'Sewa (Berlangganan)'}
							</p>
							<p className="mt-1.5 text-sm">{instansi?.edition_description}</p>
							{isBeli ? (
								<p className="mt-2 text-sm">
									Instansi memegang hak pakai perpetual dan menerima salinan kode sumber sebagai aset.
									Pengoperasian harian tetap berada pada infrastruktur bersama yang dikelola{' '}
									{penyedia}, dengan hak memindahkan data dan sistem ke infrastruktur sendiri kapan
									pun dikehendaki.
								</p>
							) : (
								<p className="mt-2 text-sm">
									Hak pakai berlaku selama masa berlangganan aktif. Kode sumber tetap milik {penyedia}
									. Bila langganan berakhir, instansi tetap berhak menerima ekspor lengkap data
									kejadiannya.
								</p>
							)}
							<p className="mt-2 text-xs text-muted-foreground">
								Hak pakai pada kedua paket bersifat internal instansi. Menjual kembali, menyewakan, atau
								me-white-label Aplikasi kepada pihak lain tetap dilarang — lihat tab{' '}
								<b>Pengguna Berkontrak</b> bagian 4.
							</p>
						</div>
					</Section>

					<Section number="13" title="Penghentian akses & penghapusan akun">
						<p>
							Anda dapat meminta penghapusan akun kapan saja melalui {kontak || 'kanal kontak instansi'}.
							Data kejadian yang sudah menjadi bagian dari dokumen penanganan (berita acara) tetap
							disimpan instansi sebagai arsip resmi sesuai ketentuan kearsipan, meski akun Anda dihapus.
						</p>
						<p>
							{penyedia} dan instansi berhak, secara sepihak dan tanpa pemberitahuan sebelumnya,
							menangguhkan, memblokir, atau mengakhiri akses Pengguna apabila Pengguna melanggar Ketentuan
							ini, atau apabila terdeteksi aktivitas mencurigakan, penipuan, atau penyalahgunaan yang
							membahayakan keamanan sistem maupun pengguna lain.
						</p>
					</Section>

					<Section number="14" title="Perubahan ketentuan">
						<p>
							Ketentuan ini dapat diperbarui bila fitur atau kewajiban hukum berubah. Perubahan berlaku
							setelah dipublikasikan di dalam Aplikasi atau melalui saluran komunikasi resmi. Versi yang
							berlaku selalu ditampilkan di bagian atas halaman ini. Penggunaan layanan setelah pembaruan
							berarti Anda menyetujui versi terbaru.
						</p>
					</Section>

					<Section number="15" title="Hukum yang berlaku & penyelesaian sengketa">
						<Bullets
							items={[
								'Ketentuan ini diatur oleh dan ditafsirkan berdasarkan hukum yang berlaku di wilayah Republik Indonesia.',
								`Segala perselisihan yang timbul dari atau terkait dengan Ketentuan ini diselesaikan terlebih dahulu secara musyawarah untuk mufakat antara Pengguna, ${penyelenggara}, dan/atau ${penyedia}.`,
								`Apabila musyawarah tidak mencapai mufakat dalam waktu 30 (tiga puluh) hari kalender, sengketa diselesaikan melalui Pengadilan Negeri yang wilayah hukumnya mencakup kantor pusat ${penyedia}.`,
							]}
						/>
					</Section>

					<Section number="16" title="Hubungi kami">
						<p>Untuk pertanyaan, keluhan, atau laporan penyalahgunaan Aplikasi, hubungi kami melalui:</p>
						<Bullets
							items={[
								`Penyedia sistem: ${penyedia}`,
								`Dukungan teknis: ${legal?.penyedia?.email || '—'}`,
								`Kanal legal: ${emailLegal || '—'}`,
								legal?.penyedia?.telepon ? `Telepon/WhatsApp: ${legal.penyedia.telepon}` : null,
								alamatPenyedia ? `Alamat kantor: ${alamatPenyedia}` : null,
								`Kontak instansi penyelenggara: ${kontak || '—'}`,
							].filter(Boolean)}
						/>
					</Section>
				</TabsContent>

				{/* --------------------------- TAB B: PENGGUNA BERKONTRAK --------------------------- */}
				<TabsContent value="berkontrak" className="mt-4 space-y-4 outline-none focus-visible:ring-0">
					<Callout tone="info" title="Bagian ini untuk instansi & entitas berkontrak">
						Ketentuan di bawah mengikat pihak yang menandatangani Perjanjian Kerja Sama (PKS) dengan{' '}
						{penyedia} — bukan warga pengguna aplikasi. Bila Anda memakai SISUPIT sebagai pelapor, petugas,
						atau relawan, ketentuan yang berlaku bagi Anda ada di tab <b>Pengguna Umum</b>.
					</Callout>

					<Section number="1" title="Definisi">
						<Bullets
							items={[
								'"Aplikasi": platform digital SISUPIT, mencakup aplikasi mobile, web, API, sistem backend, dan seluruh fitur di dalamnya.',
								`"${penyedia}": badan hukum perseroan terbatas yang sah menurut hukum Republik Indonesia selaku pemilik eksklusif Aplikasi.`,
								'"Pengguna Berkontrak": pengguna — baik entitas pemerintah, badan usaha, maupun perorangan — yang terikat perjanjian tertulis terpisah seperti Perjanjian Kerja Sama (PKS), Master Services Agreement (MSA), Surat Perintah Kerja (SPK), atau formulir berlangganan resmi dengan penyedia.',
								'"Akun Turunan (Sub-Account)": akun tambahan yang didaftarkan atau dikelola di bawah Pengguna Berkontrak untuk dipakai pegawai, petugas, relawan, mitra, atau pihak internal lainnya.',
								'"Penyalahgunaan Hak (Abuse of Rights)": penggunaan fitur, lisensi, data, atau hak akses melebihi batas peruntukan yang diperbolehkan dalam Ketentuan ini maupun PKS, atau tindakan yang merugikan penyedia maupun pihak ketiga.',
							]}
						/>
					</Section>

					<Section number="2" title="Hubungan hukum & hierarki dokumen">
						<Bullets
							items={[
								'Kedudukan perjanjian utama: bagi Pengguna Berkontrak, Ketentuan ini merupakan satu kesatuan dan bagian tidak terpisahkan dari PKS/MSA yang telah ditandatangani.',
								`Hierarki ketentuan (order of precedence): apabila terdapat pertentangan antara Ketentuan ini dan klausul dalam PKS khusus, maka klausul PKS yang berlaku — sejauh tidak mengurangi batasan tanggung jawab (limitation of liability) dan hak perlindungan kekayaan intelektual milik ${penyedia} dalam Ketentuan ini.`,
							]}
						/>
					</Section>

					<Section number="3" title="Tanggung jawab atas Akun Turunan">
						<Bullets
							items={[
								'Tanggung jawab renteng: Pengguna Berkontrak bertanggung jawab penuh secara hukum dan finansial atas seluruh aktivitas, data yang diunggah, serta pelanggaran yang dilakukan pemegang Akun Turunan di bawah naungannya.',
								'Pengawasan akses: Pengguna Berkontrak wajib memastikan seluruh pemegang Akun Turunan memahami dan mematuhi Ketentuan ini, termasuk larangan penyalahgunaan data warga.',
								'Pemberitahuan pelanggaran: Pengguna Berkontrak wajib segera memberitahukan penyedia bila terjadi indikasi penyalahgunaan kredensial atau kebocoran akses pada sistem mereka.',
							]}
						/>
					</Section>

					<Section number="4" title="Larangan tegas & bentuk penyalahgunaan hak">
						<p>Pengguna Berkontrak dilarang keras melakukan tindakan berikut:</p>
						<Bullets
							items={[
								`Eksploitasi kuota & reselling: menjual kembali (resell), menyewakan, membagikan hak akses di luar batas lisensi (account sharing), atau melakukan white-labeling atas Aplikasi tanpa izin tertulis dari ${penyedia}.`,
								'Pengrusakan & rekayasa sistem: melakukan reverse engineering, dekode, scraping data otomatis (bot/spider), atau membebani infrastruktur server melebihi batas wajar termasuk serangan penolakan layanan (DDoS).',
								'Penyalahgunaan data & privasi: mengambil, mengunduh, atau memanfaatkan data pengguna lain maupun data sistem untuk kepentingan komersial yang bertentangan dengan tujuan perjanjian.',
								'Tindakan melanggar hukum: memanfaatkan Aplikasi untuk memfasilitasi transaksi ilegal, pencucian uang, penipuan, atau pelanggaran hak kekayaan intelektual pihak mana pun.',
							]}
						/>
						<Callout title="Berlaku untuk seluruh paket, termasuk paket Beli">
							Larangan menjual kembali, menyewakan, dan me-white-label berlaku tanpa pengecualian pada
							paket Sewa maupun paket Beli. Hak pakai perpetual dan penyerahan salinan kode sumber pada
							paket Beli adalah hak pemakaian internal instansi — bukan hak mendistribusikan,
							memperdagangkan, atau melisensikan ulang Aplikasi kepada wilayah atau pihak lain.
						</Callout>
					</Section>

					<Section number="5" title="Implikasi pelanggaran & wanprestasi">
						<p>
							Apabila Pengguna Berkontrak terbukti melakukan Penyalahgunaan Hak atau melanggar Ketentuan
							ini:
						</p>
						<Bullets
							items={[
								'Status wanprestasi: pelanggaran atas Ketentuan ini secara otomatis dikualifikasikan sebagai pelanggaran berat (material breach / wanprestasi) terhadap PKS yang berlaku.',
								'Hak penangguhan akses: penyedia berhak secara sepihak memblokir atau membatasi akses Aplikasi secara seketika tanpa pemberitahuan terlebih dahulu dan tanpa kewajiban membayar ganti rugi apa pun.',
								'Hangusnya biaya: seluruh biaya langganan, deposit, atau pembayaran yang telah disetorkan tidak dapat ditarik kembali (non-refundable) sebagai kompensasi awal atas pemutusan hubungan akibat wanprestasi.',
								'Denda & tuntutan kerugian: penyedia berhak menuntut penggantian kerugian materiil maupun immateriil, termasuk denda wanprestasi yang diatur dalam PKS utama.',
							]}
						/>
						<p className="text-xs">
							Penangguhan akses tidak menghapus kewajiban penyedia menyerahkan ekspor data kejadian milik
							instansi sebagaimana diatur dalam PKS.
						</p>
					</Section>

					<Section number="6" title="Batasan tanggung jawab">
						<Bullets
							items={[
								'Prinsip "as is": Aplikasi disediakan berdasarkan kondisi sebagaimana adanya. Penyedia tidak menjamin Aplikasi beroperasi tanpa henti atau bebas total dari gangguan teknis maupun keadaan kahar (force majeure).',
								'Pengecualian kerugian konsekuensial: penyedia tidak bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan (lost profit), kehilangan data, atau gangguan operasional yang dialami Pengguna Berkontrak akibat kesalahan penggunaan atau penyalahgunaan oleh pihak Pengguna Berkontrak sendiri.',
								'Batas maksimal kerugian: dalam kondisi apa pun di mana penyedia dinyatakan bertanggung jawab secara hukum, batas maksimal ganti rugi yang wajib dibayarkan penyedia dibatasi sebesar nilai biaya langganan bulanan yang dibayarkan Pengguna Berkontrak pada bulan terjadinya insiden.',
							]}
						/>
					</Section>

					<Section number="7" title="Ganti rugi">
						<p>
							Pengguna Berkontrak setuju untuk membela, mengganti rugi, dan membebaskan {penyedia} beserta
							jajaran direksi, komisaris, karyawan, dan agennya dari segala bentuk tuntutan, klaim hukum,
							gugatan, atau denda dari pihak ketiga maupun instansi pemerintah yang timbul akibat:
						</p>
						<Bullets
							items={[
								'penyalahgunaan hak atau kegagalan Pengguna Berkontrak dalam menjaga keamanan sistem maupun akunnya;',
								'pelanggaran hukum atau pelanggaran hak pihak ketiga yang dilakukan Pengguna Berkontrak maupun Akun Turunannya.',
							]}
						/>
					</Section>

					<Section number="8" title="Pemutusan hubungan & pengesampingan Pasal 1266 KUHPerdata">
						<Bullets
							items={[
								`Penghentian sewaktu-waktu: penyedia berhak menghentikan layanan apabila Pengguna Berkontrak terindikasi melakukan tindakan yang berpotensi merusak reputasi atau integritas sistem ${penyedia}.`,
								'Pengesampingan ketentuan hukum: terkait pemutusan perjanjian akibat pelanggaran, Para Pihak secara tegas sepakat mengesampingkan ketentuan Pasal 1266 Kitab Undang-Undang Hukum Perdata, sehingga pemutusan kerja sama dan pembekuan akses dapat dilakukan secara sah tanpa memerlukan putusan atau penetapan hakim/pengadilan.',
							]}
						/>
					</Section>

					<Section number="9" title="Hukum yang berlaku & penyelesaian sengketa">
						<Bullets
							items={[
								'Ketentuan ini diatur dan ditafsirkan sepenuhnya berdasarkan hukum yang berlaku di Republik Indonesia.',
								`Setiap perselisihan yang tidak dapat diselesaikan secara musyawarah mufakat dalam waktu 30 (tiga puluh) hari kalender diselesaikan secara eksklusif melalui Pengadilan Negeri di wilayah hukum tempat kedudukan kantor pusat ${penyedia}.`,
							]}
						/>
					</Section>

					<Section number="10" title="Kontak legal">
						<p>
							Untuk pelaporan pelanggaran atau verifikasi status Pengguna Berkontrak, hubungi tim legal
							kami:
						</p>
						<Bullets
							items={[
								`Entitas: ${penyedia}`,
								`Email legal: ${emailLegal || '—'}`,
								legal?.penyedia?.telepon ? `Telepon: ${legal.penyedia.telepon}` : null,
								alamatPenyedia ? `Alamat kantor: ${alamatPenyedia}` : null,
							].filter(Boolean)}
						/>
					</Section>
				</TabsContent>
			</Tabs>
		</InfoShell>
	);
}

Terms.layout = infoLayout('Syarat & Ketentuan');
