/**
 * Perekam video demo alur Sisupit DAMKAR (end-to-end, berurutan per peran).
 *
 * Alur yang direkam:
 *   warga lapor -> notif Pusat Komando -> admin verifikasi + Broadcast Misi
 *   -> petugas meluncur -> notif relawan -> relawan meluncur -> tiba di lokasi
 *   -> insiden ditutup + Laporan Kegiatan Penyelamatan (Berita Acara)
 *
 * Tiap adegan = satu context Playwright dengan recordVideo sendiri, lalu klip
 * digabung memakai ffmpeg bawaan Playwright.
 *
 * ENV:
 *   SISUPIT_URL   base URL   (default http://127.0.0.1:8000)
 *   OUT_DIR       folder keluaran (default ./out)
 *   SYNC_CMD      perintah shell untuk menyamakan desa relawan dgn desa laporan.
 *                 Placeholder {REPORT_ID}, {EMAIL}. Kosong = lewati.
 *   SCENES        daftar adegan yang dijalankan, mis. "1" atau "1,2" (default semua)
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUT = path.resolve(process.env.OUT_DIR || path.join(__dirname, 'out'));
const CLIPS = path.join(OUT, 'clips');
const STATE = path.join(OUT, 'state');
const ONLY = (process.env.SCENES || '').split(',').filter(Boolean).map(Number);

// PENTING — pemilihan pemeran & titik kejadian TIDAK bebas:
//   * siaran ke relawan memakai ceiling DESA (Setting::KEY_NOTIFY_LEVEL_RELAWAN), dan
//   * take-action/arrive dijaga User::withinReportJurisdiction() yang membandingkan
//     KODE WILAYAH TERSPESIFIK milik user (desa bila terisi) dengan kode laporan.
// Jadi petugas & relawan yang dipakai HARUS sedesa dengan titik kejadian. Data lokal
// dan staging berbeda desa, sehingga presetnya pun berbeda.
const TARGETS = {
	local: {
		// Host disamarkan: chromium memetakan denpasar.sisupit.com -> 127.0.0.1 lewat
		// --host-resolver-rules (lihat LAUNCH_ARGS), jadi origin yang dipakai browser
		// benar-benar domain produksi TANPA menyentuh server mana pun. sisupit.com ikut
		// dipetakan agar percobaan WebSocket Echo tidak nyasar ke Reverb produksi.
		base: 'http://denpasar.sisupit.com:8000',
		geo: { latitude: -8.7033, longitude: 115.2075, accuracy: 12 }, // Pemogan
		lokasi: 'Pemogan, Denpasar Selatan',
		cast: {
			warga: { email: 'warga3@sisupit.com', role: 'Warga / Pelapor', name: 'Warga Sipil 3' },
			petugas: { email: 'petugas1@sisupit.com', role: 'Petugas Damkar', name: 'Petugas Damkar 1' },
			admin: { email: 'admin@denpasar.go.id', role: 'Admin Pusat Komando', name: 'Admin Damkar Denpasar' },
			relawan: { email: 'relawan2@sisupit.com', role: 'Relawan', name: 'Relawan Bali 2' },
		},
	},
	staging: {
		base: 'https://staging.sisupit.com',
		geo: { latitude: -8.693, longitude: 115.247, accuracy: 12 }, // Sanur Kauh (5171012010)
		lokasi: 'Sanur Kauh, Denpasar Selatan',
		cast: {
			warga: { email: 'warga3@sisupit.com', role: 'Warga / Pelapor', name: 'Warga Sipil 3' },
			petugas: { email: 'petugas2@sisupit.com', role: 'Petugas Damkar', name: 'Petugas Damkar 2' },
			admin: { email: 'admin@denpasar.go.id', role: 'Admin Pusat Komando', name: 'Admin Damkar Denpasar' },
			relawan: { email: 'relawan2@sisupit.com', role: 'Relawan', name: 'Relawan Bali 2' },
		},
	},
};

const TARGET = TARGETS[process.env.TARGET || 'local'];
if (!TARGET) throw new Error('TARGET harus "local" atau "staging"');
const BASE = (process.env.SISUPIT_URL || TARGET.base).replace(/\/$/, '');
const GEO = TARGET.geo;
const LOKASI = TARGET.lokasi;
const PASS = process.env.DEMO_PASS || 'password';
const CAST = Object.fromEntries(Object.entries(TARGET.cast).map(([k, v]) => [k, { ...v, pass: PASS }]));

// Pemetaan DNS tingkat-browser (tanpa mengubah file hosts sistem). Hanya untuk target
// lokal: membuat origin terbaca sebagai domain produksi sekaligus mencegah koneksi
// tak sengaja ke server sungguhan.
const LAUNCH_ARGS =
	(process.env.TARGET || 'local') === 'local'
		? ['--host-resolver-rules=MAP denpasar.sisupit.com 127.0.0.1, MAP sisupit.com 127.0.0.1']
		: [];

const TOTAL_STEPS = 14;
const OVERLAY = fs.readFileSync(path.join(__dirname, 'overlay.js'), 'utf8');

const log = (...a) => console.log('[rec]', ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------------------------------------------------------- context */

async function makeContext(browser, clip, role) {
	const dir = path.join(CLIPS, clip);
	fs.rmSync(dir, { recursive: true, force: true });
	fs.mkdirSync(dir, { recursive: true });

	const statePath = path.join(STATE, `${role}.json`);
	const ctx = await browser.newContext({
		viewport: { width: 1920, height: 1080 },
		recordVideo: { dir, size: { width: 1920, height: 1080 } },
		storageState: fs.existsSync(statePath) ? statePath : undefined,
		geolocation: GEO,
		permissions: ['geolocation'],
		locale: 'id-ID',
		timezoneId: 'Asia/Makassar',
	});
	// Geolokasi bawaan Chromium hanya hidup di secure context (https / localhost).
	// Karena host demo disamarkan lewat http://denpasar.sisupit.com:8000, API-nya diblokir,
	// jadi kita sediakan penyedia posisi sendiri dengan koordinat demo yang sama.
	await ctx.addInitScript(`(() => {
		const pos = () => ({
			coords: {
				latitude: ${GEO.latitude}, longitude: ${GEO.longitude}, accuracy: ${GEO.accuracy},
				altitude: null, altitudeAccuracy: null, heading: null, speed: null,
			},
			timestamp: Date.now(),
		});
		const geo = {
			getCurrentPosition: (ok) => setTimeout(() => ok(pos()), 350),
			watchPosition: (ok) => { setTimeout(() => ok(pos()), 350); return setInterval(() => ok(pos()), 5000); },
			clearWatch: (id) => clearInterval(id),
		};
		Object.defineProperty(navigator, 'geolocation', { value: geo, configurable: true });
	})();`);
	await ctx.addInitScript(OVERLAY);
	const page = await ctx.newPage();
	page.setDefaultTimeout(30000);
	// Penjaga mutu: sekali saja ada respons 5xx (mis. BroadcastException saat Reverb mati),
	// aplikasi memunculkan layar "Internal Server Error" yang IKUT TEREKAM. Lebih baik
	// rekaman digagalkan daripada video cacat terkirim.
	const problems = [];
	page.on('response', (r) => {
		if (r.status() >= 500) problems.push(`${r.status()} ${r.request().method()} ${r.url()}`);
	});
	// t0 dipakai untuk memangkas layar putih di awal klip: perekaman sudah berjalan
	// sejak context dibuat, sementara halaman pertama (dashboard/detail) butuh
	// beberapa detik untuk dimuat.
	return { ctx, page, dir, clip, t0: Date.now(), trim: 0, problems };
}

/** goto halaman pertama sekaligus mencatat berapa detik awal yang harus dipangkas. */
async function openFirst(scene, url) {
	await scene.page.goto(url, { waitUntil: 'networkidle' });
	scene.trim = Math.max(0, (Date.now() - scene.t0) / 1000 - 0.7);
	log(`  ${scene.clip}: pangkas ${scene.trim.toFixed(1)}s di awal`);
}

async function finishClip(scene) {
	await scene.page.waitForTimeout(900);
	if (scene.problems && scene.problems.length) {
		throw new Error(`klip ${scene.clip}: ada respons 5xx (layar error ikut terekam) -> ${scene.problems.join(' ; ')}`);
	}
	await scene.ctx.close();
	const file = fs.readdirSync(scene.dir).find((f) => f.endsWith('.webm'));
	if (!file) throw new Error(`klip ${scene.clip} tidak menghasilkan video`);
	const target = path.join(CLIPS, `${scene.clip}.webm`);
	fs.renameSync(path.join(scene.dir, file), target);
	fs.rmSync(scene.dir, { recursive: true, force: true });
	log(`klip selesai: ${scene.clip}.webm`);
	return { file: target, trim: scene.trim };
}

/* ------------------------------------------------------------ ui helpers */

const sx = (page, fn, ...args) =>
	page.evaluate(
		([f, a]) => window.__sx && window.__sx[f] && window.__sx[f](...a),
		[fn, args],
	).catch(() => {});

const caption = (page, n, title, sub) => sx(page, 'caption', title, sub, n, TOTAL_STEPS);
const captionHide = (page) => sx(page, 'captionHide');
const role = (page, r) => sx(page, 'role', r.role, r.name);
const pushOn = (page, t, b) => sx(page, 'push', t, b);
const pushOff = (page) => sx(page, 'pushHide');

/**
 * Tombol aksi yang BENAR-BENAR terlihat. Halaman detail merender sebagian tombol dua kali
 * (varian mobile disembunyikan lewat kelas Tailwind), sehingga pencarian biasa bisa
 * mengunci elemen tersembunyi dan menggantung saat diklik.
 */
const btn = (page, re) => page.locator('button:visible').filter({ hasText: re }).first();

/** Muat ulang halaman agar panel aksi memakai status terbaru sesudah sebuah aksi. */
async function refresh(page, pause = 1800) {
	await page.reload({ waitUntil: 'networkidle' });
	await page.waitForTimeout(pause);
}

async function spotlight(page, locator) {
	const box = await locator.boundingBox();
	if (box) await sx(page, 'spotlight', box.x, box.y, box.width, box.height);
	await page.waitForTimeout(1600);
}

async function moveTo(page, locator) {
	await locator.scrollIntoViewIfNeeded().catch(() => {});
	await page.waitForTimeout(220);
	const box = await locator.boundingBox();
	if (!box) throw new Error('elemen tidak terlihat saat akan diklik');
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 26 });
	await page.waitForTimeout(280);
}

async function click(page, locator, pause = 700) {
	await moveTo(page, locator);
	await sx(page, 'ripple');
	await page.mouse.down();
	await page.waitForTimeout(90);
	await page.mouse.up();
	await page.waitForTimeout(pause);
}

async function typeInto(page, locator, text, pause = 500) {
	await moveTo(page, locator);
	await locator.click();
	await locator.type(text, { delay: 42 });
	await page.waitForTimeout(pause);
}

/** Scroll halus (bukan lompatan) supaya enak ditonton. */
async function smoothScroll(page, dy, steps = 22) {
	for (let i = 0; i < steps; i++) {
		await page.mouse.wheel(0, dy / steps);
		await page.waitForTimeout(26);
	}
	await page.waitForTimeout(320);
}

/* ------------------------------------------------------------- auth prep */

async function prepareLogin(browser, key) {
	const acc = CAST[key];
	fs.mkdirSync(STATE, { recursive: true });
	const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
	const page = await ctx.newPage();
	await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
	await page.fill('input[name="email"]', acc.email);
	await page.fill('input[name="password"]', acc.pass);
	await page.click('button[type="submit"]');
	// Inertia POST + redirect butuh waktu; jangan menilai dari networkidle saja.
	await page
		.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 45000 })
		.catch(() => {});
	await page.waitForLoadState('networkidle').catch(() => {});
	if (page.url().includes('/login')) throw new Error(`login gagal untuk ${acc.email}`);
	await ctx.storageState({ path: path.join(STATE, `${key}.json`) });
	await ctx.close();
	log(`sesi siap: ${key} (${acc.email}) -> ${new URL(page.url()).pathname}`);
}

/* ------------------------------------------------------------- adegan 1  */

async function sceneWarga(browser, state) {
	const scene = await makeContext(browser, '01-warga-lapor', 'warga');
	const { page } = scene;
	await openFirst(scene, `${BASE}/reports/create`);
	await role(page, CAST.warga);
	await caption(
		page,
		1,
		'Warga membuka formulir Lapor Darurat',
		'Lokasi kejadian terdeteksi otomatis, warga tidak perlu mengetik alamat.',
	);
	await page.waitForTimeout(2600);

	// Tunggu GPS + reverse-geocode selesai mengisi yurisdiksi tersembunyi.
	await page.waitForFunction(
		() => document.querySelector('input[name="city_code"]')?.value?.length > 0,
		null,
		{ timeout: 45000 },
	);
	const alamat = await page.inputValue('input[name="city_code"]');
	log('yurisdiksi terisi, city_code =', alamat);
	await caption(
		page,
		2,
		'Titik lokasi terkunci di peta',
		'Pin merah bisa digeser bila posisi kejadian sedikit berbeda.',
	);
	await page.waitForTimeout(3200);

	const rumah = page.locator('button:visible').filter({ hasText: /^Rumah$/ }).first();
	await caption(page, 3, 'Pilih jenis kejadian', 'Cukup satu klik, tanpa formulir panjang saat keadaan darurat.');
	await click(page, rumah, 900);

	await smoothScroll(page, 380);
	await caption(page, 4, 'Tambahkan patokan dan foto', 'Boleh dilewati bila keadaan mendesak — laporan tetap bisa dikirim.');
	await typeInto(page, page.locator('#address'), 'Depan Warung Bu Made, gang sempit sebelah bengkel');
	await typeInto(page, page.locator('#description'), 'Api dari dapur rumah warga, asap tebal, warga sudah dievakuasi.');

	// Foto opsional (collapsible).
	const fotoToggle = page.getByRole('button', { name: /Tambah foto jika aman/i });
	if (await fotoToggle.count()) {
		await click(page, fotoToggle.first(), 600);
		const fileInput = page.locator('input[name="photos"]');
		await fileInput.setInputFiles(path.join(__dirname, 'assets', 'foto-demo.jpg')).catch((e) => log('foto dilewati:', e.message));
		await page.waitForTimeout(1400);
	}

	await smoothScroll(page, 420);
	await caption(page, 5, 'Kirim laporan', 'Laporan langsung masuk ke Pusat Komando Damkar sesuai wilayah kejadian.');
	const submit = page.locator('form button[type="submit"]:visible').last();
	await click(page, submit, 300);

	await page.waitForURL(/\/reports\/thanks\/\d+/, { timeout: 45000 });
	const reportId = page.url().match(/thanks\/(\d+)/)[1];
	state.reportId = Number(reportId);
	log('laporan dibuat, id =', reportId);

	await page.waitForLoadState('networkidle');
	await caption(
		page,
		6,
		'Laporan diterima',
		'Warga mendapat nomor laporan dan pesan dari pejabat setempat.',
	);
	await page.waitForTimeout(3400);
	await smoothScroll(page, 360, 16);
	await page.waitForTimeout(1800);

	await captionHide(page);
	return finishClip(scene);
}

/* ------------------------------------------------------------- adegan 2  */

async function scenePetugasNotif(browser, state) {
	const scene = await makeContext(browser, '02-petugas-notifikasi', 'petugas');
	const { page } = scene;
	await openFirst(scene, `${BASE}/dashboard`);
	await role(page, CAST.petugas);
	await caption(page, 7, 'Sirine berbunyi di ponsel petugas', 'Petugas piket langsung tahu ada laporan baru, walau ponsel sedang senyap.');
	await page.waitForTimeout(1200);
	await pushOn(page, '🚨 DARURAT KEBAKARAN!', `Depan Warung Bu Made, gang sempit sebelah bengkel — ${LOKASI}.`);
	await page.waitForTimeout(4200);
	await pushOff(page);
	await page.waitForTimeout(600);

	// Lonceng: badge dibaca dari shared props Inertia saat halaman dimuat.
	const bell = page.locator('header button:has(svg), header a:has(svg)').first();
	if (await bell.count()) await spotlight(page, bell);

	await caption(page, 8, 'Petugas memeriksa laporan', 'Foto, titik peta, dan identitas pelapor tampil lengkap.');
	await page.goto(`${BASE}/reports/show/${state.reportId}`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(2600);
	await smoothScroll(page, 400);
	await page.waitForTimeout(1600);

	await captionHide(page);
	return finishClip(scene);
}

/* ------------------------------------------------------------- adegan 3  */

async function sceneAdminBroadcast(browser, state) {
	const scene = await makeContext(browser, '03-admin-verifikasi-broadcast', 'admin');
	const { page } = scene;
	await openFirst(scene, `${BASE}/reports/show/${state.reportId}`);
	await role(page, CAST.admin);
	await caption(page, 9, 'Pusat Komando memeriksa laporan', 'Laporan yang tidak benar bisa ditolak; yang sah diteruskan ke lapangan.');
	await page.waitForTimeout(2400);

	const panel = page.getByText('Verifikasi Laporan Masuk').first();
	if (await panel.count()) await spotlight(page, panel);

	const broadcast = btn(page, /Broadcast Misi/i);
	await caption(page, 10, 'Misi disiarkan', 'Satu tombol memanggil petugas dan relawan siaga di sekitar titik kejadian.');
	await click(page, broadcast, 900);

	const konfirmasi = btn(page, /Ya, Siarkan/i);
	await click(page, konfirmasi, 2600);

	await page.waitForTimeout(2400);
	await captionHide(page);
	return finishClip(scene);
}

/* ------------------------------------------------------------- adegan 4  */

async function scenePetugasMeluncur(browser, state) {
	const scene = await makeContext(browser, '04-petugas-meluncur', 'petugas');
	const { page } = scene;
	await openFirst(scene, `${BASE}/reports/show/${state.reportId}`);
	await role(page, CAST.petugas);
	await caption(page, 11, 'Petugas meluncur ke lokasi', 'Status laporan berubah menjadi Penanganan dan posisi regu terpantau di peta.');
	await page.waitForTimeout(2000);

	const meluncur = btn(page, /Meluncur ke Lokasi/i);
	await click(page, meluncur, 3000);
	await page.waitForTimeout(2600);
	await smoothScroll(page, 320);
	await page.waitForTimeout(2200);

	await captionHide(page);
	return finishClip(scene);
}

/* ------------------------------------------------------------- adegan 5  */

async function sceneRelawan(browser, state) {
	const scene = await makeContext(browser, '05-relawan-meluncur', 'relawan');
	const { page } = scene;
	await openFirst(scene, `${BASE}/dashboard`);
	await role(page, CAST.relawan);
	await caption(page, 12, 'Relawan sekitar ikut disiagakan', 'Panggilan bantuan hanya dikirim ke relawan di desa kejadian, yang paling dekat.');
	await page.waitForTimeout(1200);
	await pushOn(page, '🚨 BANTUAN DIBUTUHKAN', `Kebakaran rumah di ${LOKASI}. Ketuk untuk melihat rute.`);
	await page.waitForTimeout(4200);
	await pushOff(page);
	await page.waitForTimeout(800);

	await page.goto(`${BASE}/reports/show/${state.reportId}`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(1800);

	await caption(page, 13, 'Relawan menuju lokasi', 'Peta menunjukkan jalan dan jarak menuju titik kejadian.');
	await click(page, btn(page, /Meluncur ke Lokasi/i), 3200);
	// Panel aksi baru menampilkan "Tiba di Lokasi" setelah status responder diperbarui.
	await refresh(page, 2400);

	await caption(page, 13, 'Relawan tiba di lokasi', 'Waktu tiba tercatat otomatis.');
	await click(page, btn(page, /Tiba di Lokasi/i), 3000);
	await page.waitForTimeout(2200);

	await captionHide(page);
	return finishClip(scene);
}

/* ------------------------------------------------------------- adegan 6  */

async function sceneSelesai(browser, state) {
	const scene = await makeContext(browser, '06-selesai-berita-acara', 'petugas');
	const { page } = scene;
	await openFirst(scene, `${BASE}/reports/show/${state.reportId}`);
	await role(page, CAST.petugas);
	await page.waitForTimeout(1600);

	await caption(page, 14, 'Regu tiba di titik kejadian', 'Waktu tiba tercatat otomatis.');
	await click(page, btn(page, /Tiba di Lokasi/i), 2800);
	await refresh(page, 2200);

	await caption(page, 14, 'Insiden selesai ditangani', 'Warga yang melapor menerima pemberitahuan bahwa kejadian sudah tertangani.');
	await click(page, btn(page, /Tandai Insiden Selesai/i), 900);
	await click(page, btn(page, /Ya, Selesaikan/i), 3400);
	await page.waitForTimeout(2600);

	// Naik ke atas supaya badge status "Selesai" terlihat jelas sebagai penutup.
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
	await page.waitForTimeout(2400);

	await caption(
		page,
		14,
		'Laporan kegiatan penyelamatan',
		'Petugas melengkapi berita acara sebagai arsip resmi penanganan.',
	);
	const buatBA = page.locator('a:visible, button:visible').filter({ hasText: /^\s*\+?\s*Buat\s*$/i }).first();
	if (await buatBA.count()) {
		await click(page, buatBA, 2600);
		await page.waitForLoadState('networkidle').catch(() => {});
		await page.waitForTimeout(2200);
		await smoothScroll(page, 360, 18);
		await page.waitForTimeout(2400);
	}

	await captionHide(page);
	return finishClip(scene);
}

/* -------------------------------------------------------- kartu pembuka  */

const CARD_CSS = `
	*{margin:0;padding:0;box-sizing:border-box}
	body{width:1920px;height:1080px;background:radial-gradient(1500px 900px at 50% 6%,#171e28 0%,#080b10 62%);
		color:#fff;font-family:Inter,"Segoe UI",system-ui,sans-serif;display:flex;align-items:center;
		justify-content:center;overflow:hidden}
	.wrap{text-align:center;animation:up .9s cubic-bezier(.2,.7,.3,1) both;padding:0 80px}
	@keyframes up{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
	.mark{width:108px;height:108px;border-radius:28px;background:linear-gradient(145deg,#E0241B,#9d100a);
		display:flex;align-items:center;justify-content:center;margin:0 auto 38px;
		box-shadow:0 22px 56px rgba(224,36,27,.44)}
	h1{font-size:64px;font-weight:800;letter-spacing:-.022em}
	.sub{margin-top:20px;font-size:27px;color:#9dadbe;font-weight:500}
	.rule{width:92px;height:4px;background:#E0241B;border-radius:4px;margin:38px auto}
	.steps{display:flex;gap:13px;justify-content:center;flex-wrap:wrap;max-width:1500px;margin:0 auto}
	.pill{font-size:19px;font-weight:600;color:#c9d6e2;background:rgba(255,255,255,.06);
		border:1px solid rgba(255,255,255,.1);padding:12px 22px;border-radius:999px}
`;

function cardHtml(title, sub, pills) {
	return `<!doctype html><html lang="id"><head><meta charset="utf-8"><style>${CARD_CSS}</style></head><body>
		<div class="wrap">
			<div class="mark"><svg width="54" height="54" viewBox="0 0 24 24" fill="#fff"><path d="M13 2L4.5 13.5H11L9.5 22 19 9.5h-6.8z"/></svg></div>
			<h1>${title}</h1>
			<div class="sub">${sub}</div>
			<div class="rule"></div>
			<div class="steps">${pills.map((p) => `<span class="pill">${p}</span>`).join('')}</div>
		</div></body></html>`;
}

async function sceneCard(browser, clip, html, hold = 5200) {
	const scene = await makeContext(browser, clip, '__none__');
	await scene.page.setContent(html, { waitUntil: 'load' });
	scene.trim = Math.max(0, (Date.now() - scene.t0) / 1000 - 0.5);
	await scene.page.waitForTimeout(hold);
	return finishClip(scene);
}

const INTRO = cardHtml('Panduan Aplikasi Sisupit', 'Dari laporan warga sampai insiden selesai ditangani', [
	'1. Warga melapor',
	'2. Laporan diterima Pusat Komando',
	'3. Diperiksa & disiarkan',
	'4. Petugas meluncur',
	'5. Relawan membantu',
	'6. Insiden selesai',
]);

const OUTRO = cardHtml('Cepat karena satu alur', 'Warga, petugas, dan relawan terhubung dalam satu sistem', [
	'Melapor tanpa mengetik alamat',
	'Panggilan langsung ke ponsel',
	'Posisi regu terpantau',
	'Setiap kejadian terarsip',
]);

/* ---------------------------------------------------------------- gabung */

// ffmpeg bawaan Playwright dibangun dengan --disable-everything (hanya VP8/WebM),
// jadi TIDAK bisa dipakai untuk keluaran MP4/H.264. Pakai ffmpeg-static (build penuh).
function ffmpegPath() {
	const candidates = [
		path.join(__dirname, '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
		path.join(__dirname, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
		process.env.FFMPEG_PATH || '',
	];
	const found = candidates.find((c) => c && fs.existsSync(c));
	if (!found) throw new Error('ffmpeg penuh tidak ditemukan (npm i ffmpeg-static)');
	return found;
}

function concat(clips) {
	const ff = ffmpegPath();
	const target = path.join(OUT, 'sisupit-alur-lengkap.mp4');
	// filter_complex concat: aman walau klip beda frame-rate/timebase (klip Playwright
	// bervariasi karena perekaman berbasis screencast, bukan frame rate tetap).
	// -ss sebelum -i memangkas layar putih saat halaman pertama masih dimuat.
	const inputs = clips.map((c) => `${c.trim > 0.4 ? `-ss ${c.trim.toFixed(2)} ` : ''}-i "${c.file}"`).join(' ');
	const chain = clips.map((_, i) => `[${i}:v:0]`).join('');
	execSync(
		`"${ff}" -y ${inputs} -filter_complex "${chain}concat=n=${clips.length}:v=1:a=0[v]" ` +
			`-map "[v]" -c:v libx264 -preset medium -crf 21 -pix_fmt yuv420p -r 25 -movflags +faststart "${target}"`,
		{ stdio: ['ignore', 'ignore', 'inherit'] },
	);
	return target;
}

/* ------------------------------------------------------------------ main */

const SCENES = [
	{ n: 1, key: 'warga', fn: sceneWarga },
	{ n: 2, key: 'petugas', fn: scenePetugasNotif },
	{ n: 3, key: 'admin', fn: sceneAdminBroadcast },
	{ n: 4, key: 'petugas', fn: scenePetugasMeluncur },
	{ n: 5, key: 'relawan', fn: sceneRelawan },
	{ n: 6, key: 'petugas', fn: sceneSelesai },
];

/**
 * Saat Vite dev berjalan, Laravel menulis public/hot dan menyajikan aset dari
 * http://[::1]:5173. Dari host samaran (origin berbeda) aset itu diblokir CORS sehingga
 * React tak pernah ter-mount. Selama perekaman, hot dinonaktifkan sementara agar dipakai
 * aset build produksi — lalu DIKEMBALIKAN persis seperti semula (server dev milik user
 * tidak disentuh).
 */
const HOT = path.join(process.env.PROJECT_DIR || 'C:/laragon/www/sisupit', 'public', 'hot');
function hotOff() {
	if (!fs.existsSync(HOT)) return null;
	const isi = fs.readFileSync(HOT, 'utf8');
	fs.unlinkSync(HOT);
	log('public/hot dinonaktifkan sementara (pakai aset build produksi)');
	return isi;
}
function hotOn(isi) {
	if (isi !== null && isi !== undefined && !fs.existsSync(HOT)) {
		fs.writeFileSync(HOT, isi);
		log('public/hot dikembalikan');
	}
}

(async () => {
	fs.mkdirSync(CLIPS, { recursive: true });
	const hotBackup = hotOff();
	process.on('exit', () => hotOn(hotBackup));
	const browser = await chromium.launch({
		headless: process.env.HEADED !== '1',
		args: LAUNCH_ARGS,
	});

	for (const key of Object.keys(CAST)) await prepareLogin(browser, key);

	const state = { reportId: Number(process.env.REPORT_ID) || null };
	const produced = [];
	const full = ONLY.length === 0;

	if (full) produced.push(await sceneCard(browser, '00-pembuka', INTRO, 5400));

	for (const s of SCENES) {
		if (ONLY.length && !ONLY.includes(s.n)) continue;
		log(`--- adegan ${s.n} (${s.key}) ---`);
		produced.push(await s.fn(browser, state));

		// Setelah laporan dibuat: samakan desa relawan dgn desa laporan supaya
		// siaran relawan (ceiling DESA) benar-benar sampai.
		if (s.n === 1 && process.env.SYNC_CMD && state.reportId) {
			const cmd = process.env.SYNC_CMD.replace('{REPORT_ID}', state.reportId).replace('{EMAIL}', CAST.relawan.email);
			log('sinkronisasi desa relawan...');
			execSync(cmd, { stdio: 'inherit' });
		}
	}

	if (full) produced.push(await sceneCard(browser, '07-penutup', OUTRO, 5600));

	await browser.close();

	hotOn(hotBackup);

	if (full) {
		const mp4 = concat(produced);
		log('VIDEO JADI:', mp4);
	} else {
		log('klip parsial:', produced.map((p) => path.basename(p.file)).join(', '));
	}
})().catch((e) => {
	console.error('[rec] GAGAL:', e);
	process.exit(1);
});
