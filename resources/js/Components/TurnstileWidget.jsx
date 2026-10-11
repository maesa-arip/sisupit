import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// Cloudflare Turnstile - lapis kedua lapor TANPA LOGIN (TASK_77). Satu-satunya skrip pihak ketiga
// di form lapor, jadi kegagalannya WAJIB dilaporkan ke atas (`onError`), bukan ditelan: server
// menerima laporan tanpa token HANYA bila klien menyatakan widget gagal (`turnstile_status=error`,
// dicatat `tanpa_captcha`). Laporan darurat tak boleh terblokir karena Cloudflare tak terjangkau
// dari HP pelapor.
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// Skrip yang tak kunjung siap dalam jendela ini dianggap gagal (sinyal lemah, diblokir jaringan).
const LOAD_TIMEOUT_MS = 12000;

let scriptPromise = null;

function loadTurnstile() {
	if (window.turnstile) return Promise.resolve(window.turnstile);
	if (scriptPromise) return scriptPromise;

	scriptPromise = new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = SCRIPT_SRC;
		script.async = true;
		script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')));
		script.onerror = () => {
			scriptPromise = null;
			reject(new Error('turnstile'));
		};
		document.head.appendChild(script);
	});

	return scriptPromise;
}

const TurnstileWidget = forwardRef(function TurnstileWidget({ siteKey, onToken, onExpire, onError }, ref) {
	const containerRef = useRef(null);
	const widgetIdRef = useRef(null);
	// Callback terbaru tanpa memasang ulang widget tiap render.
	const handlersRef = useRef({ onToken, onExpire, onError });
	handlersRef.current = { onToken, onExpire, onError };

	useImperativeHandle(ref, () => ({
		// Dipanggil saat server menolak token (kedaluwarsa/dipakai ulang) - minta token baru.
		reset: () => {
			if (window.turnstile && widgetIdRef.current !== null) window.turnstile.reset(widgetIdRef.current);
		},
	}));

	useEffect(() => {
		let cancelled = false;
		const timer = setTimeout(() => {
			if (!cancelled && widgetIdRef.current === null) handlersRef.current.onError?.();
		}, LOAD_TIMEOUT_MS);

		loadTurnstile()
			.then((turnstile) => {
				if (cancelled || !containerRef.current) return;

				widgetIdRef.current = turnstile.render(containerRef.current, {
					sitekey: siteKey,
					language: 'id',
					theme: 'auto',
					callback: (token) => handlersRef.current.onToken?.(token),
					'expired-callback': () => handlersRef.current.onExpire?.(),
					'error-callback': () => {
						handlersRef.current.onError?.();
						// Mengembalikan true = galat sudah ditangani, Cloudflare tak perlu mencetaknya.
						return true;
					},
				});
			})
			.catch(() => {
				if (!cancelled) handlersRef.current.onError?.();
			});

		return () => {
			cancelled = true;
			clearTimeout(timer);
			if (window.turnstile && widgetIdRef.current !== null) window.turnstile.remove(widgetIdRef.current);
			widgetIdRef.current = null;
		};
	}, [siteKey]);

	return <div ref={containerRef} className="min-h-[65px]" />;
});

export default TurnstileWidget;
