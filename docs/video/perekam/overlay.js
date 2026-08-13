// Overlay sinematik untuk rekaman demo Sisupit.
// Disuntik lewat page.addInitScript() sehingga bertahan melintasi navigasi Inertia
// (elemen ditempel sebagai SIBLING dari root #app, jadi tidak ikut ditimpa Inertia).
// Semua elemen pointer-events:none agar tidak pernah mencuri klik dari aplikasi.
window.__sxInstall = function () {
	if (window.__sx) return;

	const NS = 'sx-overlay-' + Math.random().toString(36).slice(2, 7);
	const root = document.createElement('div');
	root.id = NS;
	root.style.cssText = [
		'position:fixed',
		'inset:0',
		'z-index:2147483000',
		'pointer-events:none',
		'font-family:Inter,"Segoe UI",system-ui,-apple-system,sans-serif',
	].join(';');

	root.innerHTML = `
		<style>
			@keyframes sxIn { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
			@keyframes sxPushIn { from { opacity:0; transform:translateY(-18px) scale(.97) } to { opacity:1; transform:translateY(0) scale(1) } }
			@keyframes sxRipple { from { opacity:.55; transform:translate(-50%,-50%) scale(.35) } to { opacity:0; transform:translate(-50%,-50%) scale(2.6) } }
			@keyframes sxPulse { 0%,100% { opacity:1 } 50% { opacity:.35 } }
			.sx-hidden { opacity:0 !important; transform:translateY(14px) !important }
		</style>

		<!-- Chip peran (kiri atas) -->
		<div class="sx-role" style="
			position:absolute; top:30px; left:30px;
			display:flex; align-items:center; gap:10px;
			padding:13px 24px 13px 17px; border-radius:999px;
			background:rgba(11,15,20,.86); backdrop-filter:blur(8px);
			border:1px solid rgba(255,255,255,.10);
			box-shadow:0 8px 24px rgba(0,0,0,.32);
			opacity:0; transition:opacity .45s ease, transform .45s ease;">
			<span class="sx-role-dot" style="width:12px;height:12px;border-radius:50%;background:#E0241B;box-shadow:0 0 0 5px rgba(224,36,27,.22);animation:sxPulse 2s infinite"></span>
			<span style="display:flex;flex-direction:column;line-height:1.15">
				<span class="sx-role-label" style="font-size:13px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#9fb0c0"></span>
				<span class="sx-role-name" style="font-size:19px;font-weight:650;color:#f2f6fa"></span>
			</span>
		</div>

		<!-- Kartu ilustrasi notifikasi HP (kanan atas) -->
		<div class="sx-push" style="
			position:absolute; top:30px; right:30px; width:520px;
			border-radius:16px; overflow:hidden;
			background:rgba(17,22,29,.94); backdrop-filter:blur(10px);
			border:1px solid rgba(255,255,255,.12);
			box-shadow:0 18px 44px rgba(0,0,0,.46);
			opacity:0; transform:translateY(-18px); transition:opacity .3s ease, transform .3s ease;">
			<div style="display:flex;gap:12px;padding:13px 14px 15px">
				<div style="flex:none;width:52px;height:52px;border-radius:14px;background:linear-gradient(145deg,#E0241B,#a3120c);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(224,36,27,.4)">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M13 2L4.5 13.5H11L9.5 22 19 9.5h-6.8z"/></svg>
				</div>
				<div style="min-width:0">
					<div style="font-size:15px;font-weight:650;color:#93a3b4;margin-bottom:4px">Sisupit &middot; sekarang</div>
					<div class="sx-push-title" style="font-size:19px;font-weight:750;color:#fff;margin-bottom:4px"></div>
					<div class="sx-push-body" style="font-size:17px;line-height:1.45;color:#b9c6d3"></div>
					
				</div>
			</div>
		</div>

		<!-- Caption bawah -->
		<div class="sx-cap" style="
			position:absolute; left:0; right:0; bottom:0;
			padding:44px 54px 42px;
			background:linear-gradient(to top,rgba(6,9,13,.95) 0%,rgba(6,9,13,.86) 55%,rgba(6,9,13,0) 100%);
			opacity:0; transform:translateY(14px);
			transition:opacity .45s ease, transform .45s ease;">
			<div style="display:flex;align-items:flex-start;gap:22px;max-width:1650px">
				<div style="flex:none;display:flex;flex-direction:column;align-items:center;gap:5px;padding-top:2px">
					<span class="sx-step" style="
						display:flex;align-items:center;justify-content:center;
						min-width:52px;height:52px;padding:0 14px;border-radius:14px;
						background:#E0241B;color:#fff;font-size:22px;font-weight:800;
						box-shadow:0 4px 14px rgba(224,36,27,.45)"></span>
					<span class="sx-step-of" style="font-size:13px;font-weight:700;letter-spacing:.1em;color:#6f8091"></span>
				</div>
				<div style="min-width:0;padding-top:1px">
					<div class="sx-cap-title" style="font-size:42px;line-height:1.22;font-weight:750;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.6)"></div>
					<div class="sx-cap-sub" style="margin-top:14px;font-size:23px;line-height:1.5;color:#b4c2cf;max-width:1350px"></div>
				</div>
			</div>
		</div>

		<!-- Kursor palsu -->
		<div class="sx-cursor" style="
			position:absolute; top:0; left:0; width:30px; height:30px;
			margin:-15px 0 0 -15px; border-radius:50%;
			background:rgba(255,255,255,.9);
			border:2px solid rgba(224,36,27,.9);
			box-shadow:0 2px 10px rgba(0,0,0,.4), inset 0 0 6px rgba(224,36,27,.35);
			opacity:0; transition:opacity .25s ease;"></div>
	`;

	const attach = () => {
		if (document.body && !document.getElementById(NS)) document.body.appendChild(root);
	};
	attach();
	if (!document.body) document.addEventListener('DOMContentLoaded', attach);
	// Inertia mengganti isi #app, bukan body — tapi jaga-jaga bila node hilang.
	setInterval(attach, 700);

	const q = (s) => root.querySelector(s);
	const cap = q('.sx-cap'),
		capTitle = q('.sx-cap-title'),
		capSub = q('.sx-cap-sub'),
		step = q('.sx-step'),
		stepOf = q('.sx-step-of'),
		roleBox = q('.sx-role'),
		roleLabel = q('.sx-role-label'),
		roleName = q('.sx-role-name'),
		push = q('.sx-push'),
		pushTitle = q('.sx-push-title'),
		pushBody = q('.sx-push-body'),
		cursor = q('.sx-cursor');

	let cx = window.innerWidth / 2,
		cy = window.innerHeight / 2;
	document.addEventListener(
		'mousemove',
		(e) => {
			cx = e.clientX;
			cy = e.clientY;
			cursor.style.transform = `translate(${cx}px,${cy}px)`;
			cursor.style.opacity = '1';
		},
		true,
	);

	// Status disimpan di sessionStorage supaya chip peran & caption SELAMAT saat
	// halaman berpindah (Inertia full-visit / redirect) — tanpa ini overlay reset
	// jadi kosong tiap navigasi dan penonton kehilangan konteks peran.
	const save = (k, v) => {
		try {
			sessionStorage.setItem(k, JSON.stringify(v));
		} catch (e) {}
	};
	const load = (k) => {
		try {
			return JSON.parse(sessionStorage.getItem(k) || 'null');
		} catch (e) {
			return null;
		}
	};

	window.__sx = {
		caption(title, sub, n, total) {
			capTitle.textContent = title || '';
			capSub.textContent = sub || '';
			if (n) step.textContent = String(n);
			if (total) stepOf.textContent = 'DARI ' + total;
			cap.style.opacity = '1';
			cap.style.transform = 'translateY(0)';
			save('__sx_cap', { title, sub, n, total });
		},
		captionHide() {
			cap.style.opacity = '0';
			cap.style.transform = 'translateY(14px)';
			save('__sx_cap', null);
		},
		role(label, name) {
			roleLabel.textContent = label || '';
			roleName.textContent = name || '';
			roleBox.style.opacity = label ? '1' : '0';
			save('__sx_role', { label, name });
		},
		push(title, body) {
			pushTitle.textContent = title || '';
			pushBody.textContent = body || '';
			push.style.opacity = '1';
			push.style.transform = 'translateY(0)';
		},
		pushHide() {
			push.style.opacity = '0';
			push.style.transform = 'translateY(-18px)';
		},
		ripple() {
			const r = document.createElement('div');
			r.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:52px;height:52px;border-radius:50%;background:rgba(224,36,27,.5);pointer-events:none;animation:sxRipple .55s ease-out forwards`;
			root.appendChild(r);
			setTimeout(() => r.remove(), 600);
		},
		// Sorot elemen sesaat agar penonton tahu ke mana harus melihat.
		spotlight(x, y, w, h) {
			const s = document.createElement('div');
			s.style.cssText = `position:absolute;left:${x - 6}px;top:${y - 6}px;width:${w + 12}px;height:${h + 12}px;border-radius:12px;border:2.5px solid #E0241B;box-shadow:0 0 0 9999px rgba(6,9,13,.42),0 0 22px rgba(224,36,27,.55);pointer-events:none;transition:opacity .35s ease`;
			root.appendChild(s);
			setTimeout(() => {
				s.style.opacity = '0';
				setTimeout(() => s.remove(), 400);
			}, 1500);
		},
	};

	// Pulihkan status dari halaman sebelumnya (tanpa menulis ulang sessionStorage).
	const r = load('__sx_role');
	if (r && r.label) {
		roleLabel.textContent = r.label;
		roleName.textContent = r.name || '';
		roleBox.style.opacity = '1';
	}
	const c = load('__sx_cap');
	if (c && c.title) {
		capTitle.textContent = c.title;
		capSub.textContent = c.sub || '';
		if (c.n) step.textContent = String(c.n);
		if (c.total) stepOf.textContent = 'DARI ' + c.total;
		cap.style.opacity = '1';
		cap.style.transform = 'translateY(0)';
	}
};
window.__sxInstall();
document.addEventListener('DOMContentLoaded', window.__sxInstall);
