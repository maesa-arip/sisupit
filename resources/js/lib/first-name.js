// Nama sapaan = kata pertama yang panjangnya minimal 3 huruf. `split(' ')[0]` saja keliru di
// Bali: "I Wayan Sudarta" jadi "I", "Ni Luh Putu" jadi "Ni". Satu aturan untuk semua dashboard
// supaya sapaan warga dan petugas tidak berbeda lagi.
export function firstName(name, fallback) {
	return name?.split(' ').find((word) => word.length >= 3) || fallback;
}
