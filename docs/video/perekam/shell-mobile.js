// Kerangka komposisi 16:9 (1920x1080) untuk video versi mobile.
// Disajikan sebagai berkas statis dari public/ agar satu origin dengan aplikasi.
//
// Geometri: mockup Samsung Galaxy S26 Ultra — layar 19,3:9 (memanjang), sudut agak
// persegi khas seri Ultra, rangka titanium, kamera punch-hole di tengah.
// Aplikasi dimuat pada lebar CSS realistis (440px) lalu diskalakan 1.07 agar mengisi
// tinggi kanvas; Chrome me-raster ulang pada skala itu sehingga teks tetap tajam.
module.exports = function shellHtml({ statusTime = '09:41' } = {}) {
	return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Sisupit</title>
<style>
	*{margin:0;padding:0;box-sizing:border-box}
	body{width:1920px;height:1080px;overflow:hidden;
		background:radial-gradient(1400px 820px at 20% 10%,#19212c 0%,#080b10 62%);
		font-family:Inter,"Segoe UI",system-ui,-apple-system,sans-serif;color:#fff}

	/* ---------- ponsel: Galaxy S26 Ultra ---------- */
	.phone{position:absolute;left:96px;top:33px;width:495px;height:1013px;padding:12px;
		border-radius:38px;
		background:linear-gradient(155deg,#8c9199 0%,#3d434b 18%,#14181d 42%,#0d1116 70%,#4a5058 100%);
		box-shadow:0 40px 90px rgba(0,0,0,.62),0 0 0 1px rgba(255,255,255,.10),
			inset 0 0 0 2.5px rgba(0,0,0,.72)}
	.screen{position:relative;width:471px;height:989px;border-radius:27px;overflow:hidden;background:#fff}
	.statusbar{position:relative;z-index:6;height:32px;background:#0b0e12;color:#eef3f8;display:flex;
		align-items:center;justify-content:space-between;padding:0 18px;font-size:12.5px;font-weight:600}
	.statusbar .kanan{display:flex;align-items:center;gap:6px;opacity:.92}
	.wrap{position:relative;width:471px;height:957px;overflow:hidden}
	iframe{width:440px;height:894px;border:0;display:block;background:#fff;
		transform:scale(1.07);transform-origin:top left}

	/* kamera punch-hole di tengah */
	.lensa{position:absolute;top:8px;left:50%;transform:translateX(-50%);width:11px;height:11px;
		border-radius:50%;background:#05070a;box-shadow:0 0 0 1.5px rgba(255,255,255,.12);z-index:8}
	/* tombol samping */
	.tombol{position:absolute;right:-2px;width:3px;border-radius:2px;
		background:linear-gradient(180deg,#6d737b,#2b3037)}
	.tombol.a{top:250px;height:64px}
	.tombol.b{top:334px;height:104px}

	/* ---------- splash aplikasi ---------- */
	.splash{position:absolute;inset:0;background:#E0241B;display:flex;align-items:center;
		justify-content:center;z-index:40;transition:opacity .55s ease;pointer-events:none}
	.splash.pergi{opacity:0}

	/* ---------- notifikasi ponsel ---------- */
	.push{position:absolute;top:46px;left:13px;width:445px;z-index:30;pointer-events:none;
		background:rgba(24,29,37,.975);border:1px solid rgba(255,255,255,.12);border-radius:22px;
		box-shadow:0 22px 50px rgba(0,0,0,.6);overflow:hidden;
		opacity:0;transform:translateY(-18px);transition:opacity .32s ease,transform .32s ease}
	.push .isi{display:flex;gap:13px;padding:15px 16px 16px}
	.push .ikon{flex:none;width:42px;height:42px;border-radius:12px;
		background:linear-gradient(145deg,#E0241B,#a3120c);display:flex;align-items:center;
		justify-content:center;box-shadow:0 4px 12px rgba(224,36,27,.45)}
	.push .merek{font-size:11.5px;font-weight:650;color:#93a3b4;letter-spacing:.02em;margin-bottom:3px}
	.push .judul{font-size:16px;font-weight:750;color:#fff;margin-bottom:3px;line-height:1.25}
	.push .badan{font-size:14.5px;line-height:1.42;color:#c2ceda}

	/* ---------- panel kanan ---------- */
	.panel{position:absolute;left:706px;top:0;right:0;height:1080px;padding-right:80px;
		display:flex;flex-direction:column;justify-content:center;pointer-events:none}
	.peran{display:inline-flex;align-items:center;gap:13px;align-self:flex-start;
		padding:12px 22px 12px 16px;border-radius:999px;background:rgba(255,255,255,.06);
		border:1px solid rgba(255,255,255,.11);margin-bottom:42px;opacity:0;transition:opacity .45s ease}
	.peran .titik{width:12px;height:12px;border-radius:50%;background:#E0241B;
		box-shadow:0 0 0 5px rgba(224,36,27,.2);animation:denyut 2s infinite}
	@keyframes denyut{0%,100%{opacity:1}50%{opacity:.35}}
	.peran .teks{display:flex;flex-direction:column;line-height:1.22}
	.peran .lbl{font-size:13px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#93a5b7}
	.peran .nama{font-size:19px;font-weight:650;color:#f4f8fb}

	.cap{opacity:0;transform:translateY(18px);transition:opacity .5s ease,transform .5s ease}
	.langkah{display:flex;align-items:center;gap:15px;margin-bottom:22px}
	.langkah .no{display:flex;align-items:center;justify-content:center;min-width:54px;height:54px;
		padding:0 14px;border-radius:15px;background:#E0241B;color:#fff;font-size:23px;font-weight:800;
		box-shadow:0 8px 24px rgba(224,36,27,.45)}
	.langkah .dari{font-size:14px;font-weight:700;letter-spacing:.11em;color:#6d7d8e}
	.cap h2{font-size:46px;line-height:1.2;font-weight:750;letter-spacing:-.018em}
	.cap p{margin-top:20px;font-size:24px;line-height:1.55;color:#adbdcd;max-width:900px}

	.jejak{position:absolute;left:706px;bottom:64px;display:flex;gap:10px;pointer-events:none}
	.jejak i{width:32px;height:5px;border-radius:4px;background:rgba(255,255,255,.14);display:block}
	.jejak i.aktif{background:#E0241B;box-shadow:0 0 14px rgba(224,36,27,.6)}

	.kursor{position:absolute;top:0;left:0;width:30px;height:30px;margin:-15px 0 0 -15px;
		border-radius:50%;pointer-events:none;background:rgba(255,255,255,.26);
		border:3px solid rgba(255,255,255,.92);box-shadow:0 3px 14px rgba(0,0,0,.5);
		opacity:0;transition:opacity .25s ease;z-index:60}
	@keyframes riak{from{opacity:.5;transform:translate(-50%,-50%) scale(.3)}
		to{opacity:0;transform:translate(-50%,-50%) scale(2.4)}}
</style></head><body>
	<div class="phone">
		<div class="tombol a"></div><div class="tombol b"></div>
		<div class="screen">
			<div class="lensa"></div>
			<div class="statusbar">
				<span>${statusTime}</span>
				<span class="kanan">
					<svg width="16" height="12" viewBox="0 0 24 18" fill="#eef3f8"><path d="M1 12h3v6H1zm5-3h3v9H6zm5-4h3v13h-3zm5-4h3v17h-3z"/></svg>
					<svg width="16" height="12" viewBox="0 0 24 18" fill="#eef3f8"><path d="M12 16.5l-3-3.6a5.6 5.6 0 016 0zM3 9.2l-2-2.4a13 13 0 0122 0l-2 2.4a10 10 0 00-18 0z"/></svg>
					<svg width="21" height="12" viewBox="0 0 26 14" fill="none"><rect x=".8" y=".8" width="21" height="12.4" rx="3" stroke="#eef3f8" stroke-width="1.4"/><rect x="2.6" y="2.6" width="16" height="8.8" rx="1.6" fill="#eef3f8"/><path d="M23.6 5v4c1 -.4 1.4-1 1.4-2s-.4-1.6-1.4-2z" fill="#eef3f8"/></svg>
				</span>
			</div>
			<div class="wrap"><iframe id="app-frame" src="about:blank" allow="geolocation *"></iframe></div>

			<div class="splash" id="splash">
				<svg width="112" height="112" viewBox="0 0 24 24" fill="#fff"><path d="M13 2L4.5 13.5H11L9.5 22 19 9.5h-6.8z"/></svg>
			</div>

			<div class="push" id="push">
				<div class="isi">
					<div class="ikon"><svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M13 2L4.5 13.5H11L9.5 22 19 9.5h-6.8z"/></svg></div>
					<div style="min-width:0">
						<div class="merek">Sisupit &middot; sekarang</div>
						<div class="judul" id="push-judul"></div>
						<div class="badan" id="push-badan"></div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="panel">
		<div class="peran" id="peran">
			<span class="titik"></span>
			<span class="teks"><span class="lbl" id="peran-lbl"></span><span class="nama" id="peran-nama"></span></span>
		</div>
		<div class="cap" id="cap">
			<div class="langkah"><span class="no" id="cap-no"></span><span class="dari" id="cap-dari"></span></div>
			<h2 id="cap-judul"></h2>
			<p id="cap-sub"></p>
		</div>
	</div>
	<div class="jejak" id="jejak"></div>
	<div class="kursor" id="kursor"></div>

<script>
(function () {
	const $ = (id) => document.getElementById(id);
	const cap = $('cap'), push = $('push'), peran = $('peran'), kursor = $('kursor');
	const frame = $('app-frame');

	const TOTAL = 14, jejak = $('jejak');
	for (let i = 0; i < TOTAL; i++) jejak.appendChild(document.createElement('i'));
	const tandai = (n) => [...jejak.children].forEach((el, i) => el.classList.toggle('aktif', i < n));

	let cx = 960, cy = 540;
	const taruhKursor = (x, y) => {
		cx = x; cy = y;
		kursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';
		kursor.style.opacity = '1';
	};
	document.addEventListener('mousemove', (e) => taruhKursor(e.clientX, e.clientY), true);
	// Saat penunjuk di atas layar ponsel, dokumen induk tak menerima mousemove — frame anak
	// mengirim koordinatnya, lalu digeser sesuai posisi & skala iframe.
	window.addEventListener('message', (e) => {
		const d = e.data;
		if (!d || d.__sxKursor !== true) return;
		const r = frame.getBoundingClientRect();
		taruhKursor(r.left + d.x * 1.07, r.top + d.y * 1.07);
	});

	window.__sx = {
		caption(judul, sub, n, total) {
			$('cap-judul').textContent = judul || '';
			$('cap-sub').textContent = sub || '';
			if (n) { $('cap-no').textContent = String(n); tandai(n); }
			if (total) $('cap-dari').textContent = 'DARI ' + total;
			cap.style.opacity = '1'; cap.style.transform = 'translateY(0)';
		},
		captionHide() { cap.style.opacity = '0'; cap.style.transform = 'translateY(18px)'; },
		role(lbl, nama) {
			$('peran-lbl').textContent = lbl || '';
			$('peran-nama').textContent = nama || '';
			peran.style.opacity = lbl ? '1' : '0';
		},
		push(judul, badan) {
			$('push-judul').textContent = judul || '';
			$('push-badan').textContent = badan || '';
			push.style.opacity = '1'; push.style.transform = 'translateY(0)';
		},
		pushHide() { push.style.opacity = '0'; push.style.transform = 'translateY(-18px)'; },
		splashOff() { $('splash').classList.add('pergi'); },
		splashOn() { $('splash').classList.remove('pergi'); },
		ripple() {
			const r = document.createElement('div');
			r.style.cssText = 'position:absolute;left:' + cx + 'px;top:' + cy + 'px;width:54px;height:54px;' +
				'border-radius:50%;background:rgba(224,36,27,.55);pointer-events:none;z-index:59;' +
				'animation:riak .55s ease-out forwards';
			document.body.appendChild(r);
			setTimeout(() => r.remove(), 600);
		},
		buka(url) {
			return new Promise((selesai) => {
				const onLoad = () => { frame.removeEventListener('load', onLoad); selesai(true); };
				frame.addEventListener('load', onLoad);
				frame.src = url;
			});
		},
	};
})();
</script></body></html>`;
};
