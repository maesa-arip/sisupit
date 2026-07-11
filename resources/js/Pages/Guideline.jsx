import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/**
 * Panduan Desain Sisupit — halaman referensi sistem warna & komponen (route: /guideline).
 * Token warna DI-SCOPE ke `.gl` (bukan :root) supaya menampilkan sistem TARGET
 * (brand #E0241B, success emerald, selesai biru/air, volunteer) tanpa menimpa token
 * global app.css yang masih memakai nilai lama. Ikut dark-mode app lewat `.dark .gl`.
 */

const css = `
.gl {
  --background: 0 0% 98%;
  --foreground: 224 71.4% 4.1%;
  --card: 0 0% 100%;
  --muted: 220 14.3% 95.9%;
  --muted-foreground: 220 8.9% 46.1%;
  --border: 0 0% 90%;
  --input: 0 0% 90%;
  --destructive: 3 79% 49%;   --destructive-foreground: 210 20% 98%;
  --success: 160 84% 39%;      --success-foreground: 210 20% 98%;
  --info: 199 89% 48%;         --info-foreground: 210 20% 98%;
  --warning: 38 92% 50%;       --warning-foreground: 220.9 39.3% 11%;
  --teal: 175 84% 32%;         --teal-foreground: 210 20% 98%;
  --volunteer: 271 76% 53%;    --volunteer-foreground: 0 0% 100%;
  --radius: 0.5rem;
  min-height: 100vh;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.55;
}
.dark .gl {
  --background: 0 0% 6%;
  --foreground: 210 20% 98%;
  --card: 0 0% 8%;
  --muted: 0 0% 12%;
  --muted-foreground: 217.9 10.6% 64.9%;
  --border: 0 0% 15%;
  --input: 0 0% 15%;
  --destructive: 4 74% 56%;   --destructive-foreground: 210 20% 98%;
  --success: 160 72% 45%;      --success-foreground: 210 20% 98%;
  --info: 199 89% 40%;         --info-foreground: 210 20% 98%;
  --warning: 38 92% 40%;       --warning-foreground: 210 20% 98%;
  --teal: 173 66% 50%;         --teal-foreground: 210 20% 98%;
  --volunteer: 271 76% 66%;    --volunteer-foreground: 224 71% 4%;
}
.gl * { box-sizing: border-box; }
.gl .mono { font-family: ui-monospace, 'Cascadia Mono', 'Segoe UI Mono', Menlo, Consolas, monospace; font-variant-numeric: tabular-nums; }

.gl .bar { position: sticky; top: 0; z-index: 30; background: hsl(var(--background) / 0.85); backdrop-filter: blur(10px); border-bottom: 1px solid hsl(var(--border)); }
.gl .bar-in { max-width: 1000px; margin: 0 auto; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.gl .brandmark { display: flex; align-items: center; gap: 12px; }
.gl .logo { width: 34px; height: 34px; border-radius: 9px; background: hsl(var(--destructive)); display: grid; place-items: center; flex-shrink: 0; }
.gl .logo svg { width: 19px; height: 19px; fill: #fff; }
.gl .brandmark b { font-size: 15px; letter-spacing: -0.01em; display: block; }
.gl .brandmark span { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: hsl(var(--muted-foreground)); }
.gl .toggle { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px; border: 1px solid hsl(var(--border)); background: hsl(var(--card)); color: hsl(var(--foreground)); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.gl .toggle:hover { border-color: hsl(var(--foreground) / 0.35); }
.gl .toc { max-width: 1000px; margin: 0 auto; padding: 0 24px 12px; display: flex; flex-wrap: wrap; gap: 6px 14px; }
.gl .toc a { font-size: 12.5px; font-weight: 600; color: hsl(var(--muted-foreground)); text-decoration: none; }
.gl .toc a:hover { color: hsl(var(--destructive)); }

.gl .wrap { max-width: 1000px; margin: 0 auto; padding: 0 24px 120px; }
.gl .hero { padding: 52px 0 12px; }
.gl .hero h1 { font-size: clamp(30px, 5vw, 46px); line-height: 1.05; letter-spacing: -0.03em; margin: 0 0 14px; font-weight: 800; text-wrap: balance; }
.gl .hero h1 em { font-style: normal; color: hsl(var(--destructive)); }
.gl .hero p { max-width: 62ch; font-size: 17px; color: hsl(var(--muted-foreground)); margin: 0; }

.gl section { margin-top: 64px; scroll-margin-top: 108px; }
.gl .eyebrow { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
.gl .eyebrow .n { font-family: ui-monospace, monospace; font-size: 12px; font-weight: 700; color: hsl(var(--destructive)); }
.gl .eyebrow .t { font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: hsl(var(--muted-foreground)); white-space: nowrap; }
.gl .eyebrow::after { content: ""; height: 1px; flex: 1; background: hsl(var(--border)); }
.gl h2.sec { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 6px; }
.gl .lead { color: hsl(var(--muted-foreground)); max-width: 70ch; margin: 0 0 24px; font-size: 15px; }
.gl h3.sub { font-size: 15px; font-weight: 700; margin: 30px 0 14px; }

.gl .callout { border: 1px solid hsl(var(--c, var(--info)) / 0.3); background: hsl(var(--c, var(--info)) / 0.08); border-radius: 12px; padding: 16px 18px; display: flex; gap: 14px; }
.gl .callout .ic { flex-shrink: 0; width: 22px; height: 22px; color: hsl(var(--c, var(--info))); }
.gl .callout p { margin: 0; font-size: 14px; }
.gl .callout b { color: hsl(var(--c, var(--info))); }

.gl .grid { display: grid; gap: 16px; }
.gl .g2 { grid-template-columns: repeat(2, 1fr); }
.gl .g3 { grid-template-columns: repeat(3, 1fr); }
.gl .g4 { grid-template-columns: repeat(4, 1fr); }

.gl .swatch { border: 1px solid hsl(var(--border)); border-radius: var(--radius); overflow: hidden; background: hsl(var(--card)); }
.gl .swatch .band { height: 72px; background: hsl(var(--c)); }
.gl .swatch .body { padding: 13px 15px 15px; }
.gl .swatch h4 { margin: 0 0 3px; font-size: 14px; display: flex; align-items: center; gap: 8px; }
.gl .swatch h4 i { width: 10px; height: 10px; border-radius: 3px; background: hsl(var(--c)); }
.gl .swatch .new { font-size: 10px; color: hsl(var(--muted-foreground)); font-weight: 600; }
.gl .swatch .role { margin: 0 0 11px; font-size: 12.5px; color: hsl(var(--muted-foreground)); }
.gl .swatch dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 3px 10px; font-size: 11.5px; }
.gl .swatch dt { color: hsl(var(--muted-foreground)); }
.gl .swatch dd { margin: 0; text-align: right; }

.gl .neutral-tile { border: 1px solid hsl(var(--border)); border-radius: 10px; overflow: hidden; }
.gl .neutral-tile .b { height: 52px; }
.gl .neutral-tile .l { padding: 8px 10px; font-size: 11px; }
.gl .neutral-tile .l b { display: block; font-size: 12px; }
.gl .neutral-tile .l span { color: hsl(var(--muted-foreground)); }

.gl .btn { font: inherit; height: 40px; padding: 0 18px; border-radius: var(--radius); font-size: 13px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid transparent; transition: background .15s, border-color .15s, opacity .15s; }
.gl .btn-solid { background: hsl(var(--c)); color: hsl(var(--c-fg)); }
.gl .btn-solid:hover { background: hsl(var(--c) / 0.9); }
.gl .btn-outline { background: transparent; border-color: hsl(var(--c)); color: hsl(var(--c)); }
.gl .btn-outline:hover { background: hsl(var(--c) / 0.1); }
.gl .btn-soft { background: hsl(var(--c) / 0.1); color: hsl(var(--c)); }
.gl .btn-soft:hover { background: hsl(var(--c) / 0.18); }
.gl .btn-ghost { background: transparent; color: hsl(var(--c)); }
.gl .btn-ghost:hover { background: hsl(var(--c) / 0.1); }
.gl .btn[disabled] { opacity: .5; pointer-events: none; }
.gl .btn-sm { height: 32px; padding: 0 12px; font-size: 12px; }
.gl .btn-lg { height: 48px; padding: 0 24px; font-size: 14px; }

.gl .samples { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.gl .btnrow { display: grid; grid-template-columns: 130px 1fr; gap: 16px; align-items: center; padding: 15px 0; border-bottom: 1px solid hsl(var(--border)); }
.gl .btnrow:last-child { border-bottom: 0; }
.gl .btnrow .lab b { font-size: 13.5px; display: flex; align-items: center; gap: 9px; }
.gl .btnrow .lab b i { width: 12px; height: 12px; border-radius: 4px; background: hsl(var(--c)); }

.gl .badge { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: hsl(var(--c) / 0.1); color: hsl(var(--c)); border: 1px solid hsl(var(--c) / 0.2); }
.gl .badge i { width: 6px; height: 6px; border-radius: 999px; background: hsl(var(--c)); }

.gl .flow { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.gl .flow .arrow { color: hsl(var(--muted-foreground)); font-size: 13px; }

.gl .card { border: 1px solid hsl(var(--border)); border-radius: 16px; background: hsl(var(--card)); padding: 20px; }
.gl .card h4 { margin: 0 0 4px; font-size: 15px; }
.gl .card p.s { margin: 0; font-size: 13px; color: hsl(var(--muted-foreground)); }

.gl .radii { display: flex; flex-wrap: wrap; gap: 20px; }
.gl .radii figure { margin: 0; text-align: center; }
.gl .radii .box { width: 88px; height: 64px; background: hsl(var(--destructive) / 0.12); border: 1.5px solid hsl(var(--destructive) / 0.5); }
.gl .radii figcaption { margin-top: 8px; font-size: 12px; }
.gl .radii figcaption b { display: block; }
.gl .radii figcaption span { display: block; color: hsl(var(--muted-foreground)); }

.gl .type .row { display: grid; grid-template-columns: 120px 1fr; gap: 18px; align-items: baseline; padding: 12px 0; border-bottom: 1px solid hsl(var(--border)); }
.gl .type .row:last-child { border-bottom: 0; }
.gl .type .meta { font-size: 12px; color: hsl(var(--muted-foreground)); }
.gl .type .meta b { display: block; color: hsl(var(--foreground)); font-size: 12.5px; }

.gl .space-row { display: flex; align-items: center; gap: 14px; padding: 6px 0; }
.gl .space-row .bar { height: 16px; background: hsl(var(--info) / 0.5); border-radius: 3px; }
.gl .space-row .lab { font-size: 12.5px; color: hsl(var(--muted-foreground)); }
.gl .space-row .lab b { color: hsl(var(--foreground)); }

.gl .elev { display: grid; place-items: center; text-align: center; height: 76px; border: 1px solid hsl(var(--border)); border-radius: 12px; background: hsl(var(--card)); font-size: 12.5px; font-weight: 600; }
.gl .elev span { font-weight: 400; color: hsl(var(--muted-foreground)); }
.gl .s-none { box-shadow: none; }
.gl .s-sm { box-shadow: 0 1px 2px hsl(0 0% 0% / 0.06); }
.gl .s-md { box-shadow: 0 4px 12px hsl(0 0% 0% / 0.10); }
.gl .s-lg { box-shadow: 0 12px 30px hsl(0 0% 0% / 0.16); }

.gl .field { display: flex; flex-direction: column; gap: 6px; }
.gl .field label { font-size: 13px; font-weight: 600; }
.gl .field .inp { height: 40px; padding: 0 12px; border-radius: calc(var(--radius) - 2px); border: 1px solid hsl(var(--input)); background: hsl(var(--card)); color: hsl(var(--foreground)); font: inherit; font-size: 14px; }
.gl .field .inp:focus { outline: 2px solid hsl(var(--info)); outline-offset: 1px; border-color: transparent; }
.gl .field .inp.err { border-color: hsl(var(--destructive)); }
.gl .field .err-msg { font-size: 12.5px; color: hsl(var(--destructive)); font-weight: 500; }
.gl .field .hint { font-size: 12px; color: hsl(var(--muted-foreground)); }

.gl .dd { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.gl .dd .box { border: 1px solid hsl(var(--border)); border-radius: 12px; padding: 16px 18px; }
.gl .dd .box.do { border-color: hsl(var(--success) / 0.4); background: hsl(var(--success) / 0.06); }
.gl .dd .box.no { border-color: hsl(var(--destructive) / 0.4); background: hsl(var(--destructive) / 0.06); }
.gl .dd .tag { font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.gl .dd .do .tag { color: hsl(var(--success)); }
.gl .dd .no .tag { color: hsl(var(--destructive)); }
.gl .dd ul { margin: 10px 0 0; padding-left: 18px; }
.gl .dd li { font-size: 13px; margin: 6px 0; }
.gl .dd code { font-family: ui-monospace, monospace; font-size: 12px; background: hsl(var(--muted)); padding: 1px 5px; border-radius: 4px; }

.gl footer { margin-top: 84px; padding-top: 22px; border-top: 1px solid hsl(var(--border)); font-size: 12.5px; color: hsl(var(--muted-foreground)); }
.gl footer code { font-family: ui-monospace, monospace; }

@media (max-width: 820px) { .gl .g4, .gl .g3 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) {
  .gl .g4, .gl .g3, .gl .g2, .gl .dd { grid-template-columns: 1fr; }
  .gl .btnrow, .gl .type .row { grid-template-columns: 1fr; gap: 10px; }
}
@media (prefers-reduced-motion: reduce) { .gl * { transition: none !important; } }
`;

const cv = (c) => ({ '--c': `var(--${c})`, '--c-fg': `var(--${c}-foreground)` });

function Swatch({ c, name, role, light, dark, hex, isNew }) {
	return (
		<div className="swatch" style={{ '--c': `var(--${c})` }}>
			<div className="band" />
			<div className="body">
				<h4>
					<i />
					{name} {isNew && <span className="new">(baru)</span>}
				</h4>
				<p className="role">{role}</p>
				<dl>
					<dt>Light</dt>
					<dd className="mono">{light}</dd>
					<dt>Dark</dt>
					<dd className="mono">{dark}</dd>
					<dt>Hex</dt>
					<dd className="mono">{hex}</dd>
				</dl>
			</div>
		</div>
	);
}

function BtnRow({ c, label }) {
	return (
		<div className="btnrow" style={cv(c)}>
			<div className="lab">
				<b>
					<i />
					{label}
				</b>
			</div>
			<div className="samples">
				<button className="btn btn-solid">Solid</button>
				<button className="btn btn-outline">Outline</button>
				<button className="btn btn-soft">Soft</button>
				<button className="btn btn-ghost">Ghost</button>
			</div>
		</div>
	);
}

function Badge({ c, children }) {
	return (
		<span className="badge" style={{ '--c': `var(--${c})` }}>
			<i />
			{children}
		</span>
	);
}

export default function Guideline() {
	const [dark, setDark] = useState(false);

	useEffect(() => {
		setDark(document.documentElement.classList.contains('dark'));
	}, []);

	const toggleTheme = () => {
		const el = document.documentElement;
		const next = !el.classList.contains('dark');
		el.classList.toggle('dark', next);
		try {
			localStorage.setItem('theme', next ? 'dark' : 'light');
		} catch (e) {
			/* abaikan */
		}
		setDark(next);
	};

	return (
		<>
			<Head title="Panduan Desain — Sisupit" />
			<style>{css}</style>

			<div className="gl">
				<div className="bar">
					<div className="bar-in">
						<div className="brandmark">
							<span className="logo" aria-hidden="true">
								<svg viewBox="0 0 24 24">
									<path d="M13 2 4 14h6l-1 8 9-12h-6z" />
								</svg>
							</span>
							<div>
								<b>SISUPIT</b>
								<span>Panduan Desain</span>
							</div>
						</div>
						<button className="toggle" type="button" onClick={toggleTheme} aria-label="Ganti tema">
							{dark ? 'Mode terang' : 'Mode gelap'}
						</button>
					</div>
					<nav className="toc">
						<a href="#prinsip">Prinsip</a>
						<a href="#warna">Warna</a>
						<a href="#status">Status Laporan</a>
						<a href="#tipografi">Tipografi</a>
						<a href="#rounded">Rounded</a>
						<a href="#spasi">Spasi</a>
						<a href="#elevasi">Elevasi</a>
						<a href="#tombol">Tombol</a>
						<a href="#badge">Badge</a>
						<a href="#kartu">Kartu &amp; Form</a>
						<a href="#penekanan">Penekanan</a>
						<a href="#dodont">Do &amp; Don&apos;t</a>
					</nav>
				</div>

				<div className="wrap">
					<header className="hero">
						<h1>
							Panduan desain untuk keadaan <em>darurat</em>.
						</h1>
						<p>
							Satu sistem yang menyatukan warna, tipografi, sudut, dan jarak Sisupit — di mode terang
							maupun gelap. Semua nilai memetakan token nyata di <span className="mono">app.css</span>{' '}
							&amp; <span className="mono">tailwind.config.js</span>. Aturan tunggal: gunakan token,
							jangan warna mentah.
						</p>
					</header>

					{/* 01 PRINSIP */}
					<section id="prinsip">
						<div className="eyebrow">
							<span className="n">01</span>
							<span className="t">Prinsip Inti</span>
						</div>
						<h2 className="sec">Token dulu, selalu.</h2>
						<p className="lead">
							Audit menemukan pola lama: warna ditulis mentah untuk mode terang (
							<span className="mono">bg-red-600</span>) lalu token untuk gelap (
							<span className="mono">dark:bg-destructive</span>). Akibatnya satu merah bisa tampil tiga
							nuansa berbeda. Sistem ini menghapus itu.
						</p>
						<div className="grid g2">
							<div className="callout" style={{ '--c': 'var(--success)' }}>
								<svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M20 6 9 17l-5-5" />
								</svg>
								<p>
									<b>Pakai token semantik.</b> <span className="mono">bg-destructive</span>,{' '}
									<span className="mono">text-success</span>, <span className="mono">border-info</span>.
									Otomatis benar di light &amp; dark, seragam dengan logo.
								</p>
							</div>
							<div className="callout" style={{ '--c': 'var(--destructive)' }}>
								<svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M18 6 6 18M6 6l12 12" />
								</svg>
								<p>
									<b>Jangan warna mentah.</b> <span className="mono">bg-red-600</span>,{' '}
									<span className="mono">text-blue-500</span>, hex baru. Memecah brand &amp; merusak dark
									mode.
								</p>
							</div>
						</div>
						<p className="lead" style={{ marginTop: 20 }}>
							Pengecualian sah: nilai warna pada <b>marker peta Leaflet</b> dan <b>chart</b> — ambil dari
							token via JS bila memungkinkan.
						</p>
					</section>

					{/* 02 WARNA */}
					<section id="warna">
						<div className="eyebrow">
							<span className="n">02</span>
							<span className="t">Sistem Warna</span>
						</div>
						<h2 className="sec">Merah brand + lima warna semantik.</h2>
						<p className="lead">
							Merah menanggung identitas (api/damkar) dan bahaya sekaligus. Dipilih <b>#E0241B</b> —
							cerah, mendesak, identik logo &amp; ikon Android. Teks putih di atasnya = kontras 4.74:1
							(lulus WCAG AA).
						</p>
						<div className="grid g3">
							<Swatch c="destructive" name="Destructive / Brand" role="SOS, laporan aktif/darurat, bahaya, hapus, error." light="3 79% 49%" dark="4 74% 56%" hex="#E0241B" />
							<Swatch c="success" name="Success (Emerald)" role="Penanganan berjalan, relawan aktif, konfirmasi." light="160 84% 39%" dark="160 72% 45%" hex="#10B981" />
							<Swatch c="info" name="Info (Biru / Air)" role="Laporan selesai (air memadamkan api), aksi responder, CTA sekunder." light="199 89% 48%" dark="199 89% 40%" hex="#0EA5E9" />
							<Swatch c="warning" name="Warning (Amber)" role="Menunggu validasi, standby, peringatan." light="38 92% 50%" dark="38 92% 40%" hex="#F59E0B" />
							<Swatch c="teal" name="Teal" role="Hidran & fasilitas air — peran khusus, beda dari emerald." light="175 84% 32%" dark="173 66% 50%" hex="#0D9488" />
							<Swatch c="volunteer" name="Volunteer" isNew role="Kategori relawan di peta & daftar." light="271 76% 53%" dark="271 76% 66%" hex="#9333EA" />
						</div>

						<h3 className="sub">Netral</h3>
						<p className="lead">Netral dingin yang sengaja dipilih, sama dengan aplikasi.</p>
						<div className="grid g4">
							<div className="neutral-tile">
								<div className="b" style={{ background: 'hsl(var(--background))' }} />
								<div className="l">
									<b>background</b>
									<span className="mono">0 0% 98% / 6%</span>
								</div>
							</div>
							<div className="neutral-tile">
								<div className="b" style={{ background: 'hsl(var(--card))', borderBottom: '1px solid hsl(var(--border))' }} />
								<div className="l">
									<b>card</b>
									<span className="mono">0 0% 100% / 8%</span>
								</div>
							</div>
							<div className="neutral-tile">
								<div className="b" style={{ background: 'hsl(var(--muted))' }} />
								<div className="l">
									<b>muted</b>
									<span className="mono">220 14% 96% / …12%</span>
								</div>
							</div>
							<div className="neutral-tile">
								<div className="b" style={{ background: 'hsl(var(--foreground))' }} />
								<div className="l">
									<b>foreground</b>
									<span className="mono">224 71% 4% / …98%</span>
								</div>
							</div>
						</div>
					</section>

					{/* 03 STATUS */}
					<section id="status">
						<div className="eyebrow">
							<span className="n">03</span>
							<span className="t">Status Laporan</span>
						</div>
						<h2 className="sec">Merah menyala → biru memadamkan.</h2>
						<p className="lead">
							Lifecycle: <b>Masuk → Terverifikasi → Penanganan → Selesai</b> (plus Ditolak). Warna
							menyandikan progres, dengan satu keputusan domain penting di ujungnya.
						</p>
						<div className="card" style={{ marginBottom: 16 }}>
							<div className="flow" style={{ fontSize: 13, fontWeight: 700 }}>
								<Badge c="destructive">Masuk</Badge>
								<span className="arrow">→</span>
								<Badge c="warning">Terverifikasi</Badge>
								<span className="arrow">→</span>
								<Badge c="success">Penanganan</Badge>
								<span className="arrow">→</span>
								<Badge c="info">Selesai</Badge>
								<span className="arrow">·</span>
								<Badge c="muted-foreground">Ditolak</Badge>
							</div>
						</div>
						<div className="callout" style={{ '--c': 'var(--info)' }}>
							<svg className="ic" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 2s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z" />
							</svg>
							<p>
								<b>Selesai = biru, bukan hijau.</b> Ini aplikasi pemadam kebakaran — biru identik dengan{' '}
								<b>air yang memadamkan api</b>. Merah (darurat) di awal, biru (padam/aman) di akhir.
								Emerald untuk fase <b>Penanganan</b> yang aktif berjalan; Ditolak memudar jadi netral.
							</p>
						</div>
					</section>

					{/* 04 TIPOGRAFI */}
					<section id="tipografi">
						<div className="eyebrow">
							<span className="n">04</span>
							<span className="t">Tipografi</span>
						</div>
						<h2 className="sec">Inter, satu skala disiplin.</h2>
						<p className="lead">
							Satu keluarga — <b>Inter</b> (<span className="mono">tailwind.config.js</span> ·
							fontFamily.sans). Judul rapat (<span className="mono">tracking-tight</span>), label
							huruf-besar diberi jarak, teks bodi ~65 karakter/baris.
						</p>
						<div className="type">
							<div className="row">
								<div className="meta">
									<b>Display</b>800 · -0.03em
								</div>
								<div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}>Lapor Darurat</div>
							</div>
							<div className="row">
								<div className="meta">
									<b>Judul Section</b>800 · -0.02em
								</div>
								<div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Peta Pemantauan</div>
							</div>
							<div className="row">
								<div className="meta">
									<b>Sub-judul</b>700
								</div>
								<div style={{ fontSize: 16, fontWeight: 700 }}>Panel Tindakan</div>
							</div>
							<div className="row">
								<div className="meta">
									<b>Body</b>400 · 1.6
								</div>
								<div style={{ fontSize: 15, maxWidth: '62ch' }}>
									Warga melapor, Pusat Komando memvalidasi, lalu petugas dan relawan merespons dengan
									pelacakan lokasi langsung sampai insiden ditutup.
								</div>
							</div>
							<div className="row">
								<div className="meta">
									<b>Kecil / hint</b>500
								</div>
								<div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Terakhir diperbarui 2 menit lalu</div>
							</div>
							<div className="row">
								<div className="meta">
									<b>Label</b>800 · 0.16em · UPPER
								</div>
								<div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
									Sistem Untuk Pelaporan Dini
								</div>
							</div>
						</div>
					</section>

					{/* 05 ROUNDED */}
					<section id="rounded">
						<div className="eyebrow">
							<span className="n">05</span>
							<span className="t">Sudut / Rounded</span>
						</div>
						<h2 className="sec">Skala jari-jari dari satu sumber.</h2>
						<p className="lead">
							Basis <span className="mono">--radius: 0.5rem</span> (8px). Tailwind menurunkan{' '}
							<span className="mono">sm/md/lg</span> darinya; <span className="mono">xl</span> ke atas nilai
							tetap. Makin besar &amp; penting elemennya, makin besar sudutnya.
						</p>
						<div className="radii">
							{[
								['rounded-sm', '4px', 'chip kecil, checkbox', 4],
								['rounded-md', '6px', 'input, select, tombol kecil', 6],
								['rounded-lg', '8px · --radius', 'tombol default, dropdown, tile ikon', 8],
								['rounded-xl', '12px', 'tombol menonjol (SOS/Lapor)', 12],
								['rounded-2xl', '16px', 'kartu, panel, modal', 16],
								['rounded-full', '9999px', 'badge/pill, avatar, FAB', 999],
							].map(([name, val, use, r]) => (
								<figure key={name}>
									<div className="box" style={{ borderRadius: r }} />
									<figcaption>
										<b>{name}</b>
										<span className="mono">{val}</span>
										<span>{use}</span>
									</figcaption>
								</figure>
							))}
						</div>
					</section>

					{/* 06 SPASI */}
					<section id="spasi">
						<div className="eyebrow">
							<span className="n">06</span>
							<span className="t">Spasi &amp; Layout</span>
						</div>
						<h2 className="sec">Kelipatan 4px, jarak lewat gap.</h2>
						<p className="lead">
							Skala spasi Tailwind (basis 4px). Atur jarak antar-elemen dengan{' '}
							<span className="mono">flex/grid + gap</span>, bukan margin per-elemen yang mudah dobel/kolaps.
						</p>
						<div>
							{[
								[8, '2 · 8px — jarak ikon↔teks, gap chip'],
								[12, '3 · 12px — padding tombol, gap kecil'],
								[16, '4 · 16px — gap kartu di grid'],
								[24, '6 · 24px — padding kartu/panel'],
								[48, '12 · 48px — jarak antar-blok'],
								[68, '16–18 · 64–72px — jarak antar-section'],
							].map(([w, label]) => (
								<div className="space-row" key={w}>
									<div className="bar" style={{ width: w }} />
									<div className="lab">{label}</div>
								</div>
							))}
						</div>
						<p className="lead" style={{ marginTop: 20 }}>
							Lebar konten maksimum: <span className="mono">max-w-1000/1080px</span>, dipusatkan
							(<span className="mono">mx-auto</span>) dengan padding tepi 24px.
						</p>
					</section>

					{/* 07 ELEVASI */}
					<section id="elevasi">
						<div className="eyebrow">
							<span className="n">07</span>
							<span className="t">Elevasi / Bayangan</span>
						</div>
						<h2 className="sec">Datar sebagai default.</h2>
						<p className="lead">
							Aplikasi condong flat — banyak tombol pakai <span className="mono">shadow-none</span>.
							Naikkan elevasi hanya saat elemen benar-benar mengambang.
						</p>
						<div className="grid g4">
							<div className="elev s-none">
								shadow-none
								<span>tombol datar</span>
							</div>
							<div className="elev s-sm">
								shadow-sm
								<span>kartu, input</span>
							</div>
							<div className="elev s-md">
								shadow-md
								<span>dropdown</span>
							</div>
							<div className="elev s-lg">
								shadow-lg
								<span>popover, modal, FAB</span>
							</div>
						</div>
					</section>

					{/* 08 TOMBOL */}
					<section id="tombol">
						<div className="eyebrow">
							<span className="n">08</span>
							<span className="t">Tombol</span>
						</div>
						<h2 className="sec">Empat bentuk × tiga ukuran.</h2>
						<p className="lead">
							Setiap warna semantik punya empat bentuk. Bentuklah yang menentukan penekanan, bukan hue
							baru.
						</p>
						<BtnRow c="destructive" label="Destructive" />
						<BtnRow c="success" label="Success" />
						<BtnRow c="info" label="Info" />
						<BtnRow c="warning" label="Warning" />
						<BtnRow c="teal" label="Teal" />

						<h3 className="sub">Ukuran</h3>
						<div className="samples" style={cv('destructive')}>
							<button className="btn btn-solid btn-sm">Small · h-32</button>
							<button className="btn btn-solid">Default · h-40</button>
							<button className="btn btn-solid btn-lg">Large · h-48</button>
							<button className="btn btn-solid" disabled>
								Disabled
							</button>
						</div>
					</section>

					{/* 09 BADGE */}
					<section id="badge">
						<div className="eyebrow">
							<span className="n">09</span>
							<span className="t">Badge &amp; Chip</span>
						</div>
						<h2 className="sec">Label pasif, volume terendah.</h2>
						<p className="lead">
							Selalu bentuk <b>soft</b> (<span className="mono">bg /10 · text · border /20</span>),{' '}
							<span className="mono">rounded-full</span>. Untuk status &amp; kategori yang tidak menuntut
							aksi.
						</p>
						<div className="samples">
							<Badge c="destructive">Darurat</Badge>
							<Badge c="warning">Menunggu</Badge>
							<Badge c="success">Ditangani</Badge>
							<Badge c="info">Selesai</Badge>
							<Badge c="teal">Hidran</Badge>
							<Badge c="volunteer">Relawan</Badge>
							<Badge c="muted-foreground">Nonaktif</Badge>
						</div>
					</section>

					{/* 10 KARTU & FORM */}
					<section id="kartu">
						<div className="eyebrow">
							<span className="n">10</span>
							<span className="t">Kartu &amp; Form</span>
						</div>
						<h2 className="sec">Permukaan &amp; masukan.</h2>
						<div className="grid g2">
							<div className="card s-sm">
								<h4>Kartu / Panel</h4>
								<p className="s">
									Latar <span className="mono">card</span>, garis <span className="mono">border</span>,
									sudut <span className="mono">rounded-2xl</span> (16px), padding 20–24px,{' '}
									<span className="mono">shadow-sm</span>.
								</p>
								<div className="samples" style={{ marginTop: 16, ...cv('info') }}>
									<button className="btn btn-solid btn-sm">Aksi utama</button>
									<button className="btn btn-ghost btn-sm" style={{ '--c': 'var(--muted-foreground)' }}>
										Batal
									</button>
								</div>
							</div>
							<div className="card s-sm">
								<div className="field">
									<label htmlFor="d1">Nama lokasi</label>
									<input className="inp" id="d1" placeholder="mis. Jl. Gajah Mada No. 12" />
									<span className="hint">
										Input: <span className="mono">rounded-md</span>, border{' '}
										<span className="mono">input</span>, fokus ring <span className="mono">info</span>.
									</span>
								</div>
								<div className="field" style={{ marginTop: 16 }}>
									<label htmlFor="d2">Nomor telepon</label>
									<input className="inp err" id="d2" defaultValue="08" />
									<span className="err-msg">Nomor telepon minimal 10 digit.</span>
								</div>
							</div>
						</div>
						<p className="lead" style={{ marginTop: 16 }}>
							Error form ikuti pola repo: <span className="mono">&lt;InputError message=…/&gt;</span> membaca{' '}
							<span className="mono">useForm().errors</span>. Sukses submit selalu picu toast{' '}
							<span className="mono">sonner</span> lewat <span className="mono">flashMessage()</span>.
						</p>
					</section>

					{/* 11 PENEKANAN */}
					<section id="penekanan">
						<div className="eyebrow">
							<span className="n">11</span>
							<span className="t">Aturan Penekanan</span>
						</div>
						<h2 className="sec">Satu warna, tiga volume.</h2>
						<p className="lead">
							Ini yang menjaga tampilan “menyatu” sekaligus memberi hierarki di situasi darurat. Bedakan
							urgensi lewat <b>treatment</b>, bukan menambah warna.
						</p>
						<div className="grid g3">
							<div className="card" style={cv('destructive')}>
								<div className="tag" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'hsl(var(--destructive))' }}>
									Volume tertinggi
								</div>
								<h4 style={{ marginTop: 10 }}>Solid</h4>
								<p className="s">Aksi darurat / berisiko: SOS, tandai selesai, hapus permanen.</p>
								<div style={{ marginTop: 14 }}>
									<button className="btn btn-solid">Lapor Darurat</button>
								</div>
							</div>
							<div className="card" style={cv('destructive')}>
								<div className="tag" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
									Volume sedang
								</div>
								<h4 style={{ marginTop: 10 }}>Outline</h4>
								<p className="s">Aksi sekunder / rutin: hapus item admin, batal, filter.</p>
								<div style={{ marginTop: 14 }}>
									<button className="btn btn-outline">Hapus</button>
								</div>
							</div>
							<div className="card" style={cv('destructive')}>
								<div className="tag" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
									Volume terendah
								</div>
								<h4 style={{ marginTop: 10 }}>Soft</h4>
								<p className="s">Status pasif / label: badge status, chip kategori.</p>
								<div style={{ marginTop: 14 }}>
									<Badge c="destructive">Darurat</Badge>
								</div>
							</div>
						</div>
					</section>

					{/* 12 DO/DON'T */}
					<section id="dodont">
						<div className="eyebrow">
							<span className="n">12</span>
							<span className="t">Do &amp; Don&apos;t</span>
						</div>
						<h2 className="sec">Ringkasan aturan.</h2>
						<div className="dd">
							<div className="box do">
								<div className="tag">Lakukan</div>
								<ul>
									<li>
										Pakai token: <code>bg-destructive</code>, <code>text-success</code>,{' '}
										<code>border-info</code>.
									</li>
									<li>Bedakan penekanan lewat solid / outline / soft.</li>
									<li>
										Selesai = <code>info</code> (biru/air), Penanganan = <code>success</code>.
									</li>
									<li>
										Hidran = <code>teal</code>, relawan = <code>volunteer</code>.
									</li>
									<li>
										Rounded naik sesuai bobot; jarak lewat <code>gap</code>.
									</li>
									<li>Uji tiap layar di mode terang dan gelap.</li>
								</ul>
							</div>
							<div className="box no">
								<div className="tag">Hindari</div>
								<ul>
									<li>
										Warna mentah baru: <code>bg-red-600</code>, <code>text-blue-500</code>, hex.
									</li>
									<li>
										Pola <code>light-mentah / dark:token</code> — sumber tiga-nuansa-merah.
									</li>
									<li>Dua merah mirip untuk brand vs bahaya.</li>
									<li>
										Hijau <code>142</code> murahan untuk “aktif”.
									</li>
									<li>Bayangan berat di elemen datar.</li>
									<li>Mencampur dua icon library dalam satu komponen.</li>
								</ul>
							</div>
						</div>
					</section>

					<footer>
						Sumber token: <code>resources/css/app.css</code> · <code>tailwind.config.js</code> · konvensi{' '}
						<code>.claude/skills/sisupit-ui/SKILL.md</code>. Keputusan final: brand <code>#E0241B</code>,
						success emerald, selesai biru (air). Halaman referensi — belum mengubah token global aplikasi.
					</footer>
				</div>
			</div>
		</>
	);
}
