import { Button } from '@/Components/ui/button';
import { router } from '@inertiajs/react';
import { IconLoader2 } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

// Masuk dengan Apple - HANYA di aplikasi iOS (App Store Guideline 4.8: app yang menawarkan login
// Google wajib juga menawarkan Masuk dengan Apple). Ketersediaan dideteksi dari jembatan native,
// bukan dari UA: shim iOS build 3+ memasang `AndroidBridge.signInWithApple`; Android, browser, dan
// app iOS lama tidak, sehingga tombolnya tak pernah tampil di sana.
export function hasAppleSignIn() {
	return typeof window !== 'undefined' && typeof window.AndroidBridge?.signInWithApple === 'function';
}

export default function AppleSignInButton({ disabled = false, onLoadingChange }) {
	const [available, setAvailable] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	// Callback native dipasang sekali; ref menjaga onLoadingChange yang dipanggil selalu terbaru.
	const onLoadingChangeRef = useRef(onLoadingChange);
	onLoadingChangeRef.current = onLoadingChange;

	const setBusy = (value) => {
		setLoading(value);
		onLoadingChangeRef.current?.(value);
	};

	useEffect(() => {
		setAvailable(hasAppleSignIn());

		// Native mengirim SATU string JSON: { idToken, authorizationCode, nonce, givenName, familyName }.
		// givenName/familyName hanya terisi pada otorisasi PERTAMA - server menyimpannya saat itu.
		window.onAppleCredential = (json) => {
			let credential;
			try {
				credential = JSON.parse(json);
			} catch (e) {
				setBusy(false);
				setError('Kredensial Apple tidak terbaca. Silakan coba lagi.');
				return;
			}
			router.post(
				route('apple.native'),
				{
					id_token: credential.idToken,
					nonce: credential.nonce,
					authorization_code: credential.authorizationCode || null,
					given_name: credential.givenName || null,
					family_name: credential.familyName || null,
				},
				{ onFinish: () => setBusy(false) },
			);
		};
		window.onAppleSignInCancelled = () => setBusy(false);
		window.onAppleSignInError = (msg) => {
			setBusy(false);
			setError(msg || 'Masuk dengan Apple gagal. Silakan coba lagi.');
		};
		return () => {
			delete window.onAppleCredential;
			delete window.onAppleSignInCancelled;
			delete window.onAppleSignInError;
		};
	}, []);

	if (!available) return null;

	const start = () => {
		setError(null);
		setBusy(true);
		window.AndroidBridge.signInWithApple(); // hasil kembali lewat window.onAppleCredential
	};

	// Gaya tombol mengikuti Human Interface Guidelines Apple: hitam di tema terang, putih di tema
	// gelap, logo Apple + "Masuk dengan Apple", ukuran sama dengan tombol Google.
	return (
		<div className="space-y-2">
			<Button
				type="button"
				disabled={disabled || loading}
				onClick={start}
				className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-black text-sm font-medium text-white transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-black dark:hover:bg-white/85"
			>
				{loading ? (
					<IconLoader2 className="h-5 w-5 animate-spin" />
				) : (
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
					</svg>
				)}
				{loading ? 'Memproses...' : 'Masuk dengan Apple'}
			</Button>
			{error && <p className="text-center text-xs text-destructive">{error}</p>}
		</div>
	);
}
