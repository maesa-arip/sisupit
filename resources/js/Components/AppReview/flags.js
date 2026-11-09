// Form ulasan aplikasi (TASK_86) - kartu ajakan (AppLayout) & kartu "Ulasan Aplikasi" di Profil.
// Sempat disembunyikan 2026-11-06 (FINDINGS #236); DIAKTIFKAN lagi 2026-11-09 (#239) dengan ajakan
// hanya sesudah kejadian Selesai (AppReview::shouldAsk). Ubah ke false untuk menyembunyikan
// tampilannya saja - route, controller, tabel, menu admin & testimoni tetap utuh.
export const SHOW_APP_REVIEW_FORM = true;
