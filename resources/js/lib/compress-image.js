// Kompresi foto di browser SEBELUM diunggah (FINDINGS #132).
//
// Foto kamera ponsel 3-8 MB per berkas, sementara form laporan menerima 6 foto dan berita
// acara 8 foto + KTP korban. Dikirim apa adanya, satu kiriman gampang melewati batas
// server (Nginx client_max_body_size / PHP post_max_size) dan dijawab 413 sebelum
// menyentuh Laravel. Mengecilkan ke sisi terpanjang 1920 px + JPEG 0,8 menghasilkan
// ~300-800 KB tanpa kehilangan detail yang dibutuhkan responder.
//
// FAIL-OPEN: galat apa pun (browser lama, berkas bukan gambar, HEIC yang tak bisa
// di-decode) memulangkan berkas ASLI. Validasi server tetap penjaganya; helper ini hanya
// memperkecil kemungkinan ditolak, tidak pernah menjadi alasan foto hilang.

export const COMPRESS_MAX_SIDE = 1920;
export const COMPRESS_QUALITY = 0.8;

// GIF dilewati (kanvas hanya menyimpan bingkai pertama). Selain image/* tak disentuh,
// termasuk PDF di isian KTP profil.
const shouldSkip = (file) => !(file instanceof Blob) || !file.type?.startsWith('image/') || file.type === 'image/gif';

const decode = async (file) => {
	// imageOrientation: 'from-image' menegakkan foto potret berdasarkan EXIF; tanpa itu
	// foto dari sebagian ponsel tersimpan miring 90 derajat.
	if (typeof createImageBitmap === 'function') {
		try {
			return await createImageBitmap(file, { imageOrientation: 'from-image' });
		} catch {
			// jatuh ke <img> di bawah
		}
	}
	const url = URL.createObjectURL(file);
	try {
		const img = new Image();
		img.decoding = 'async';
		img.src = url;
		await img.decode();
		return img;
	} finally {
		URL.revokeObjectURL(url);
	}
};

export async function compressImage(file, { maxSide = COMPRESS_MAX_SIDE, quality = COMPRESS_QUALITY } = {}) {
	if (shouldSkip(file)) return file;

	try {
		const source = await decode(file);
		const width = source.width;
		const height = source.height;
		if (!width || !height) return file;

		const scale = Math.min(1, maxSide / Math.max(width, height));
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(width * scale);
		canvas.height = Math.round(height * scale);

		const ctx = canvas.getContext('2d');
		// Latar putih: PNG transparan yang dijadikan JPEG akan berlatar HITAM tanpa ini.
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
		source.close?.();

		const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
		// Gambar kecil yang sudah terkompresi bisa jadi LEBIH BESAR setelah diulang.
		if (!blob || blob.size >= file.size) return file;

		const name = (file.name || 'foto').replace(/\.[^.]+$/, '') + '.jpg';
		return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified || Date.now() });
	} catch {
		return file;
	}
}

// Berurutan, bukan Promise.all: mendekode enam foto 12 MP sekaligus bisa menghabiskan
// memori WebView di ponsel kelas bawah.
export async function compressImages(files, options) {
	const out = [];
	for (const file of files) out.push(await compressImage(file, options));
	return out;
}
