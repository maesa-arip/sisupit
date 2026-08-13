/**
 * Perekam video demo Sisupit — VERSI MOBILE (aplikasi diakses dari APK Sisupit).
 *
 * Kanvas 16:9 pada 1920x1080. Mockup Samsung Galaxy S26 Ultra (layar 19,3:9): aplikasi
 * dimuat pada lebar CSS realistis 440px lalu diskalakan 1.07 agar mengisi tinggi kanvas —
 * Chrome me-raster ulang di skala itu sehingga teks tetap tajam. Sisi kanan kanvas dipakai
 * untuk caption langkah. Kerangka disajikan dari ORIGIN YANG SAMA dengan aplikasi sehingga
 * iframe bisa ditunggu & dikendalikan tanpa halangan cross-origin.
 *
 * Kesetiaan pada APK:
 *   - User-Agent = UA WebView Android dengan "; wv" DIHAPUS + " SisupitApp" ditambahkan,
 *     persis MainActivity.java:154-160. Aplikasi karenanya berperilaku seperti di dalam APK
 *     (mis. HomeController::landing me-redirect app dari "/" ke /spotlight atau /dashboard,
 *     dan tombol unduh APK disembunyikan di Spotlight/Login).
 *   - URL awal = root "/", sama seperti webUrl di MainActivity.java:83.
 *   - Splash merah + petir putih ditampilkan sesaat, meniru SplashActivity.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const shellHtml = require('./shell-mobile.js');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUT = path.resolve(process.env.OUT_DIR || path.join(__dirname, 'out-mobile'));
const CLIPS = path.join(OUT, 'clips');
const STATE = path.join(OUT, 'state');
const ONLY = (process.env.SCENES || '').split(',').filter(Boolean).map(Number);

const BASE = (process.env.SISUPIT_URL || 'http://denpasar.sisupit.com:8000').replace(/\/$/, '');
const PROJECT = process.env.PROJECT_DIR || 'C:/laragon/www/sisupit';
// Kerangka ditulis sebagai berkas statis di public/ (bukan lewat route Playwright): dokumen
// hasil intersepsi dianggap "public address space" sehingga Chrome memblokir muatan iframe
// ke 127.0.0.1 (ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS). Berkas dihapus lagi di akhir.
const SHELL_FILE = path.join(PROJECT, 'public', '__demo_mobile_shell.html');
const SHELL_URL = `${BASE}/__demo_mobile_shell.html`;
const GEO = { latitude: -8.7033, longitude: 115.2075, accuracy: 12 }; // Pemogan, Denpasar Selatan
const LOKASI = 'Pemogan, Denpasar Selatan';

// UA WebView Android sesuai yang dipasang APK (tanpa "; wv", berakhiran " SisupitApp").
const UA =
	'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) ' +
	'Version/4.0 Chrome/126.0.6478.71 Mobile Safari/537.36 SisupitApp';

const PASS = process.env.DEMO_PASS || 'password';
const CAST = {
	warga: { email: 'warga3@sisupit.com', pass: PASS, role: 'Warga / Pelapor', name: 'Warga Sipil 3' },
	petugas: { email: 'petugas1@sisupit.com', pass: PASS, role: 'Petugas Damkar', name: 'Petugas Damkar 1' },
	admin: { email: 'admin@denpasar.go.id', pass: PASS, role: 'Admin Pusat Komando', name: 'Admin Damkar Denpasar' },
	relawan: { email: 'relawan2@sisupit.com', pass: PASS, role: 'Relawan', name: 'Relawan Bali 2' },
};

const LAUNCH_ARGS = [
	'--host-resolver-rules=MAP denpasar.sisupit.com 127.0.0.1, MAP sisupit.com 127.0.0.1',
	'--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessChecks',
];
const TOTAL_STEPS = 14;
const log = (...a) => console.log('[hp]', ...a);

/* ------------------------------------------------------------- init script */

const INIT = `(() => {
	// 1) Penyedia geolokasi (origin demo bukan secure context -> API bawaan diblokir).
	const pos = () => ({
		coords: { latitude: ${GEO.latitude}, longitude: ${GEO.longitude}, accuracy: ${GEO.accuracy},
			altitude: null, altitudeAccuracy: null, heading: null, speed: null },
		timestamp: Date.now(),
	});
	Object.defineProperty(navigator, 'geolocation', {
		configurable: true,
		value: {
			getCurrentPosition: (ok) => setTimeout(() => ok(pos()), 350),
			watchPosition: (ok) => { setTimeout(() => ok(pos()), 350); return setInterval(() => ok(pos()), 5000); },
			clearWatch: (id) => clearInterval(id),
		},
	});

	// 2) Di dalam iframe: laporkan posisi penunjuk ke kerangka induk supaya kursor palsu
	//    tetap bergerak saat berada di atas layar ponsel.
	if (window.top !== window) {
		document.addEventListener('mousemove', (e) => {
			try { parent.postMessage({ __sxKursor: true, x: e.clientX, y: e.clientY }, '*'); } catch (err) {}
		}, true);
	}
})();`;

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
		userAgent: UA,
		hasTouch: true,
		geolocation: GEO,
		permissions: ['geolocation'],
		locale: 'id-ID',
		timezoneId: 'Asia/Makassar',
	});
	await ctx.addInitScript(INIT);

	const page = await ctx.newPage();
	page.setDefaultTimeout(30000);
	const problems = [];
	page.on('response', (r) => {
		// 5xx  -> layar "Internal Server Error" ikut terekam.
		// 429  -> pembatas laju `throttle:report-create` (5 laporan / 10 menit): tombol kirim
		//         seolah tak berfungsi. Mudah terjadi saat mencoba berulang kali.
		// 422  -> validasi form gagal; laporan tak pernah tercipta.
		const s = r.status();
		if (s >= 500 || s === 429 || s === 422) {
			problems.push(`${s} ${r.request().method()} ${r.url()}`);
		}
	});
	await page.goto(SHELL_URL, { waitUntil: 'load' });

	return { ctx, page, dir, clip, t0: Date.now(), trim: 0, problems };
}

async function finishClip(scene) {
	await scene.page.waitForTimeout(900);
	if (scene.problems && scene.problems.length) {
		throw new Error(`klip ${scene.clip}: ada respons 5xx -> ${scene.problems.join(' ; ')}`);
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
	page.evaluate(([f, a]) => window.__sx && window.__sx[f] && window.__sx[f](...a), [fn, args]).catch(() => {});

const caption = (page, n, judul, sub) => sx(page, 'caption', judul, sub, n, TOTAL_STEPS);
const captionHide = (page) => sx(page, 'captionHide');
const role = (page, r) => sx(page, 'role', r.role, r.name);
const pushOn = (page, t, b) => sx(page, 'push', t, b);
const pushOff = (page) => sx(page, 'pushHide');

const app = (page) => page.frameLocator('#app-frame');
/** Tombol/tautan yang benar-benar terlihat di dalam aplikasi. */
const btn = (page, re) => app(page).locator('button:visible, a:visible').filter({ hasText: re }).first();

/** Muat URL aplikasi di dalam ponsel, lalu tunggu React benar-benar ter-mount. */
async function openInApp(scene, url, { first = false } = {}) {
	const { page } = scene;
	await page.evaluate((u) => window.__sx.buka(u), url);
	await page.waitForFunction(
		() => {
			const f = document.getElementById('app-frame');
			const d = f && f.contentDocument;
			if (!d || d.readyState !== 'complete') return false;
			const root = d.getElementById('app') || d.body;
			return !!root && root.children.length > 0;
		},
		null,
		{ timeout: 60000 },
	);
	await page.waitForTimeout(900);
	if (first) {
		scene.trim = Math.max(0, (Date.now() - scene.t0) / 1000 - 0.7);
		log(`  ${scene.clip}: pangkas ${scene.trim.toFixed(1)}s di awal`);
	}
}

// Batas area layar ponsel pada kanvas (phone left 96 + padding 12; iframe mulai di bawah
// status bar 32px, tinggi 957). Ketukan di luar kotak ini pasti meleset — pernah mendarat
// di bilah navigasi bawah saat elemen sasaran masih di luar layar.
const LAYAR = { x1: 110, y1: 79, x2: 577, y2: 1032 };

async function moveTo(page, locator) {
	await locator.scrollIntoViewIfNeeded().catch(() => {});
	await page.waitForTimeout(240);
	const box = await locator.boundingBox();
	if (!box) throw new Error('elemen tidak terlihat saat akan diklik');
	const x = box.x + box.width / 2;
	const y = box.y + box.height / 2;
	if (x < LAYAR.x1 || x > LAYAR.x2 || y < LAYAR.y1 || y > LAYAR.y2) {
		throw new Error(`sasaran ketukan di luar layar ponsel (${Math.round(x)},${Math.round(y)}) — ketukan akan meleset`);
	}
	await page.mouse.move(x, y, { steps: 26 });
	await page.waitForTimeout(300);
}

async function tap(page, locator, jeda = 800) {
	// Kursor digerakkan dulu supaya penonton melihat arah ketukan, tetapi klik-nya memakai
	// locator.click(): ia melakukan uji sasaran (hit target) sendiri. Klik mouse mentah
	// pernah meleset di dalam iframe yang diskalakan CSS — tombol kirim tampak ditekan
	// padahal tidak ada permintaan yang terkirim.
	await moveTo(page, locator);
	await sx(page, 'ripple');
	await locator.click({ timeout: 20000 });
	await page.waitForTimeout(jeda);
}

async function typeInto(page, locator, teks, jeda = 500) {
	await moveTo(page, locator);
	await locator.click();
	await locator.type(teks, { delay: 45 });
	await page.waitForTimeout(jeda);
}

/** Gulir di DALAM layar ponsel: penunjuk ditaruh di atas layar dulu. */
async function scrollPhone(page, dy, steps = 20) {
	await page.mouse.move(343, 550, { steps: 6 });
	for (let i = 0; i < steps; i++) {
		await page.mouse.wheel(0, dy / steps);
		await page.waitForTimeout(28);
	}
	await page.waitForTimeout(340);
}

/* ------------------------------------------------------------- auth prep */

async function prepareLogin(browser, key) {
	const acc = CAST[key];
	fs.mkdirSync(STATE, { recursive: true });
	const ctx = await browser.newContext({ viewport: { width: 412, height: 900 }, userAgent: UA });
	const page = await ctx.newPage();
	await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
	await page.fill('input[name="email"]', acc.email);
	await page.fill('input[name="password"]', acc.pass);
	await page.click('button[type="submit"]');
	await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 45000 }).catch(() => {});
	await page.waitForLoadState('networkidle').catch(() => {});
	if (page.url().includes('/login')) throw new Error(`login gagal untuk ${acc.email}`);
	await ctx.storageState({ path: path.join(STATE, `${key}.json`) });
	await ctx.close();
	log(`sesi siap: ${key} (${acc.email})`);
}

/* ------------------------------------------------------------- adegan 1  */

async function sceneWarga(browser, state) {
	const scene = await makeContext(browser, '01-warga-lapor', 'warga');
	const { page } = scene;
	await role(page, CAST.warga);
	await caption(page, 1, 'Warga membuka aplikasi Sisupit', 'Cukup dari ponsel, tanpa perlu menelepon atau datang ke kantor.');
	await page.waitForTimeout(2100);

	// Splash APK sejenak, lalu muat root "/" persis seperti MainActivity.
	await openInApp(scene, `${BASE}/`, { first: true });
	await sx(page, 'splashOff');
	await page.waitForTimeout(2400);

	await caption(page, 2, 'Ketuk Lapor Darurat', 'Satu ketukan dari halaman depan, tidak perlu mencari-cari menu.');
	await tap(page, btn(page, /Lapor Darurat/i), 1200);
	await page.waitForTimeout(2600);

	await page.waitForFunction(
		() => {
			const d = document.getElementById('app-frame').contentDocument;
			return d && d.querySelector('input[name="city_code"]')?.value?.length > 0;
		},
		null,
		{ timeout: 60000 },
	);
	await caption(page, 3, 'Lokasi terisi otomatis', 'Titik kejadian diambil dari GPS ponsel, jadi warga tidak perlu mengetik alamat.');
	await page.waitForTimeout(3200);

	await caption(page, 4, 'Pilih jenis kejadian', 'Tombol besar agar tetap mudah ditekan meski sedang panik.');
	await scrollPhone(page, 260);
	await tap(page, app(page).locator('button:visible').filter({ hasText: /^Rumah$/ }).first(), 1000);

	await caption(page, 5, 'Tambahkan patokan dan foto', 'Boleh dilewati bila keadaan mendesak — laporan tetap bisa dikirim.');
	await scrollPhone(page, 300);
	await typeInto(page, app(page).locator('#address'), 'Depan Warung Bu Made, gang sempit sebelah bengkel');
	await typeInto(page, app(page).locator('#description'), 'Api dari dapur rumah warga, asap tebal.');

	const fotoToggle = btn(page, /Tambah foto jika aman/i);
	if (await fotoToggle.count()) {
		await tap(page, fotoToggle, 700);
		await app(page)
			.locator('input[name="photos"]')
			.setInputFiles(path.join(__dirname, 'assets', 'foto-demo.jpg'))
			.catch((e) => log('foto dilewati:', e.message));
		await page.waitForTimeout(1500);
	}

	await caption(page, 6, 'Kirim laporan', 'Laporan langsung masuk ke Pusat Komando Damkar sesuai wilayah kejadian.');
	await scrollPhone(page, 320);
	await tap(page, btn(page, /Kirim Laporan/i), 400);

	await page.waitForFunction(
		() => {
			const f = document.getElementById('app-frame');
			return f && f.contentWindow.location.pathname.includes('/reports/thanks/');
		},
		null,
		{ timeout: 60000 },
	);
	state.reportId = await page.evaluate(() => {
		const p = document.getElementById('app-frame').contentWindow.location.pathname;
		return Number(p.split('/').pop());
	});
	log('laporan dibuat, id =', state.reportId);

	await page.waitForTimeout(2400);
	await caption(page, 7, 'Laporan diterima', 'Warga mendapat nomor laporan dan pesan dari pejabat setempat.');
	await page.waitForTimeout(2600);
	await scrollPhone(page, 320, 16);
	await page.waitForTimeout(1800);

	await captionHide(page);
	return finishClip(scene);
}

/* ------------------------------------------------------------- adegan 2  */

async function scenePetugasNotif(browser, state) {
	const scene = await makeContext(browser, '02-petugas-notifikasi', 'petugas');
	const { page } = scene;
	await role(page, CAST.petugas);
	await openInApp(scene, `${BASE}/`, { first: true });
	await sx(page, 'splashOff');
	await page.waitForTimeout(1200);

	await caption(page, 8, 'Sirine berbunyi di ponsel petugas', 'Petugas piket langsung tahu ada laporan baru, walau ponsel sedang senyap.');
	await pushOn(page, '🚨 DARURAT KEBAKARAN!', `Depan Warung Bu Made — ${LOKASI}.`);
	await page.waitForTimeout(4600);
	await pushOff(page);
	await page.waitForTimeout(900);

	await caption(page, 9, 'Petugas memeriksa laporan', 'Foto, titik peta, dan identitas pelapor tampil lengkap.');
	await openInApp(scene, `${BASE}/reports/show/${state.reportId}`);
	await page.waitForTimeout(2200);
	await scrollPhone(page, 420);
	await page.waitForTimeout(1800);

	await captionHide(page);
	return finishClip(scene);
}

/* ------------------------------------------------------------- adegan 3  */

async function sceneAdminBroadcast(browser, state) {
	const scene = await makeContext(browser, '03-admin-verifikasi-broadcast', 'admin');
	const { page } = scene;
	await role(page, CAST.admin);
	await openInApp(scene, `${BASE}/reports/show/${state.reportId}`, { first: true });
	await sx(page, 'splashOff');

	await caption(page, 10, 'Pusat Komando memeriksa laporan', 'Laporan yang tidak benar bisa ditolak; yang sah diteruskan ke lapangan.');
	await page.waitForTimeout(2600);

	await tap(page, btn(page, /Broadcast Misi/i), 1000);
	await caption(page, 10, 'Misi disiarkan', 'Satu tombol memanggil petugas dan relawan siaga di sekitar titik kejadian.');
	await tap(page, btn(page, /Ya, Siarkan/i), 3000);
	await page.waitForTimeout(2600);

	await captionHide(page);
	return finishClip(scene);
}

/* ------------------------------------------------------------- adegan 4  */

async function scenePetugasMeluncur(browser, state) {
	const scene = await makeContext(browser, '04-petugas-meluncur', 'petugas');
	const { page } = scene;
	await role(page, CAST.petugas);
	await openInApp(scene, `${BASE}/reports/show/${state.reportId}`, { first: true });
	await sx(page, 'splashOff');

	await caption(page, 11, 'Petugas meluncur ke lokasi', 'Status laporan berubah menjadi Penanganan dan posisi regu terpantau di peta.');
	await page.waitForTimeout(2000);
	await tap(page, btn(page, /Meluncur ke Lokasi/i), 3000);
	await page.waitForTimeout(2400);
	await scrollPhone(page, 360);
	await page.waitForTimeout(2200);

	await captionHide(page);
	return finishClip(scene);
}

/* ------------------------------------------------------------- adegan 5  */

async function sceneRelawan(browser, state) {
	const scene = await makeContext(browser, '05-relawan-meluncur', 'relawan');
	const { page } = scene;
	await role(page, CAST.relawan);
	await openInApp(scene, `${BASE}/`, { first: true });
	await sx(page, 'splashOff');
	await page.waitForTimeout(1100);

	await caption(page, 12, 'Relawan sekitar ikut disiagakan', 'Panggilan bantuan hanya dikirim ke relawan di desa kejadian, yang paling dekat.');
	await pushOn(page, '🚨 BANTUAN DIBUTUHKAN', `Kebakaran rumah di ${LOKASI}. Ketuk untuk melihat rute.`);
	await page.waitForTimeout(4600);
	await pushOff(page);
	await page.waitForTimeout(900);

	await openInApp(scene, `${BASE}/reports/show/${state.reportId}`);
	await caption(page, 13, 'Relawan menuju lokasi', 'Peta menunjukkan jalan dan jarak menuju titik kejadian.');
	await page.waitForTimeout(1600);
	await tap(page, btn(page, /Meluncur ke Lokasi/i), 3000);

	await openInApp(scene, `${BASE}/reports/show/${state.reportId}`);
	await caption(page, 13, 'Relawan tiba di lokasi', 'Waktu tiba tercatat otomatis.');
	await tap(page, btn(page, /Tiba di Lokasi/i), 3000);
	await page.waitForTimeout(2200);

	await captionHide(page);
	return finishClip(scene);
}

/* ------------------------------------------------------------- adegan 6  */

async function sceneSelesai(browser, state) {
	const scene = await makeContext(browser, '06-selesai-berita-acara', 'petugas');
	const { page } = scene;
	await role(page, CAST.petugas);
	await openInApp(scene, `${BASE}/reports/show/${state.reportId}`, { first: true });
	await sx(page, 'splashOff');

	await caption(page, 14, 'Regu tiba di titik kejadian', 'Waktu tiba tercatat otomatis.');
	await page.waitForTimeout(1800);
	await tap(page, btn(page, /Tiba di Lokasi/i), 2600);

	await openInApp(scene, `${BASE}/reports/show/${state.reportId}`);
	await caption(page, 14, 'Insiden selesai ditangani', 'Warga yang melapor menerima pemberitahuan bahwa kejadian sudah tertangani.');
	await tap(page, btn(page, /Tandai Insiden Selesai/i), 1000);
	await tap(page, btn(page, /Ya, Selesaikan/i), 3400);
	await page.waitForTimeout(2600);

	await caption(page, 14, 'Laporan kegiatan penyelamatan', 'Petugas melengkapi berita acara sebagai arsip resmi penanganan.');
	// Tombol "+ Buat" berada jauh di bawah pada layar ponsel; mengetuknya pernah meleset ke
	// bilah navigasi bawah. Buka rutenya langsung agar adegan selalu benar.
	await openInApp(scene, `${BASE}/reports/${state.reportId}/resolution/create`);
	await page.waitForTimeout(2400);
	await scrollPhone(page, 420, 20);
	await page.waitForTimeout(2600);

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

const cardHtml = (title, sub, pills) =>
	`<!doctype html><html lang="id"><head><meta charset="utf-8"><style>${CARD_CSS}</style></head><body>
		<div class="wrap">
			<div class="mark"><svg width="54" height="54" viewBox="0 0 24 24" fill="#fff"><path d="M13 2L4.5 13.5H11L9.5 22 19 9.5h-6.8z"/></svg></div>
			<h1>${title}</h1><div class="sub">${sub}</div><div class="rule"></div>
			<div class="steps">${pills.map((p) => `<span class="pill">${p}</span>`).join('')}</div>
		</div></body></html>`;

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

const OUTRO = cardHtml('Cepat karena satu alur', 'Warga, petugas, dan relawan terhubung dalam satu aplikasi', [
	'Melapor tanpa mengetik alamat',
	'Panggilan langsung ke ponsel',
	'Posisi regu terpantau',
	'Setiap kejadian terarsip',
]);

/* ---------------------------------------------------------------- gabung */

function ffmpegPath() {
	const kandidat = [
		path.join(__dirname, '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
		path.join(__dirname, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
		process.env.FFMPEG_PATH || '',
	];
	const ada = kandidat.find((c) => c && fs.existsSync(c));
	if (!ada) throw new Error('ffmpeg penuh tidak ditemukan (npm i ffmpeg-static)');
	return ada;
}

function concat(clips) {
	const ff = ffmpegPath();
	const target = path.join(OUT, 'sisupit-alur-lengkap-mobile.mp4');
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

const HOT = path.join(process.env.PROJECT_DIR || 'C:/laragon/www/sisupit', 'public', 'hot');
const hotOff = () => {
	if (!fs.existsSync(HOT)) return null;
	const isi = fs.readFileSync(HOT, 'utf8');
	fs.unlinkSync(HOT);
	log('public/hot dinonaktifkan sementara');
	return isi;
};
const hotOn = (isi) => {
	if (isi != null && !fs.existsSync(HOT)) {
		fs.writeFileSync(HOT, isi);
		log('public/hot dikembalikan');
	}
};

const SCENES = [
	{ n: 1, key: 'warga', fn: sceneWarga },
	{ n: 2, key: 'petugas', fn: scenePetugasNotif },
	{ n: 3, key: 'admin', fn: sceneAdminBroadcast },
	{ n: 4, key: 'petugas', fn: scenePetugasMeluncur },
	{ n: 5, key: 'relawan', fn: sceneRelawan },
	{ n: 6, key: 'petugas', fn: sceneSelesai },
];

(async () => {
	fs.mkdirSync(CLIPS, { recursive: true });
	const hotBackup = hotOff();
	fs.writeFileSync(SHELL_FILE, shellHtml({}));
	log('kerangka 16:9 ditulis ke public/__demo_mobile_shell.html');
	const bersihkan = () => {
		hotOn(hotBackup);
		if (fs.existsSync(SHELL_FILE)) {
			fs.unlinkSync(SHELL_FILE);
			log('kerangka dihapus dari public/');
		}
	};
	process.on('exit', bersihkan);

	const browser = await chromium.launch({ headless: process.env.HEADED !== '1', args: LAUNCH_ARGS });
	for (const key of Object.keys(CAST)) await prepareLogin(browser, key);

	const state = { reportId: Number(process.env.REPORT_ID) || null };
	const produced = [];
	const full = ONLY.length === 0;

	if (full) produced.push(await sceneCard(browser, '00-pembuka', INTRO, 5400));
	for (const s of SCENES) {
		if (ONLY.length && !ONLY.includes(s.n)) continue;
		log(`--- adegan ${s.n} (${s.key}) ---`);
		try {
			produced.push(await s.fn(browser, state));
		} catch (e) {
			// Diagnostik: simpan tangkapan layar + URL frame supaya kegagalan bisa dilihat,
			// bukan sekadar "timeout".
			const halaman = browser.contexts().flatMap((c) => c.pages())[0];
			if (halaman) {
				const berkas = path.join(OUT, `GAGAL-adegan-${s.n}.png`);
				await halaman.screenshot({ path: berkas }).catch(() => {});
				log('URL frame saat gagal:', halaman.frames().map((f) => f.url()).join(' | '));
				log('tangkapan layar:', berkas);
			}
			throw e;
		}
	}
	if (full) produced.push(await sceneCard(browser, '07-penutup', OUTRO, 5600));

	await browser.close();
	bersihkan();

	if (full) log('VIDEO JADI:', concat(produced));
	else log('klip parsial:', produced.map((p) => path.basename(p.file)).join(', '));
})().catch((e) => {
	console.error('[hp] GAGAL:', e);
	process.exit(1);
});
