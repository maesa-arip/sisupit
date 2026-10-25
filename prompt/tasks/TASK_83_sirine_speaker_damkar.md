# TASK_83 — Sirine di speaker Damkar saat admin Broadcast (aplikasi desktop)
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_83 |
| Severity | P2 |
| Tipe | fitur kecil (web 1 baris + aplikasi desktop 1.0.2) |
| Sumber | permintaan user 2026-10-25 / FINDINGS_LOG #220 |
| Status | DONE (di-push ke main 2026-10-25, deploy via konsol; installer 1.0.2 belum dipasang di komputer Damkar) |

---

## 1. Deskripsi masalah / tujuan
Satu komputer admin dipegang operator di Damkar dan disambungkan ke speaker aktif ruangan; operator
memakai headset untuk telepon WhatsApp konfirmasi laporan. Saat admin klik Broadcast di komputer itu,
sirine harus berbunyi di SPEAKER (bukan headset). Keputusan user: cukup saat diklik dari komputer itu,
memakai aplikasi desktop Sisupit (Electron).

## 2. Reproduce
Broadcast dari komputer admin: petugas/relawan berbunyi, komputer admin diam. Tak ada test sebelumnya.

## 3. Root cause
`ReportActionController::approve` (L89-112) menyiarkan sirine hanya ke petugas/relawan/pejabat dan
membuang akun penekan tombol; admin hanya mendapat `TriageDecidedNotification` tanpa sirine. Desktop
memutar suara ke perangkat bawaan Windows (tak bisa memisahkan speaker dari headset).

## 4. Fix
- **Web** `resources/js/Pages/Front/Reports/Show.jsx` `executeApprove` onSuccess:
  `window.sisupitDesktop?.sirineBroadcast?.(report.id)`. onSuccess = broadcast sah (approve ganda = 403,
  tak sampai ke sini). Browser/APK tanpa jembatan = diam.
- **Desktop** `C:\Users\Admin\ElectronProjects\SisupitDesktop` (bukan git, cadangan `*.bak-task83`), versi 1.0.2:
  - `src/preload-lokasi.js` - `contextBridge` `sisupitDesktop.sirineBroadcast(id)` -> IPC `sisupit:sirine-broadcast`.
  - `src/main.js` - penerima IPC cek ORIGIN halaman = `baseUrl` (bukan startsWith), lalu bila
    `speakerDamkar` nyala: `terapkanSpeaker()` + `playSound('darurat')` + toast "Sirine Damkar berbunyi"
    (klik = berhenti, tidak membuka laporan). Tray "Speaker sirine Damkar": saklar, daftar speaker (radio,
    disegarkan tiap 15 dtk), "Uji sirine di speaker ini". `simpanSetelanSpeaker()` -> `sisupit-desktop.json`.
  - `src/suara.html` - `daftarSpeaker()` (tanpa entri semu default/communications), `aturSpeakerSirine(id, nama)`
    `setSinkId` HANYA elemen sirine; cocok deviceId lalu nama; tak ketemu = perangkat bawaan + `ditemukan:false`.
  - `src/config.js` - `speakerDamkar: false`, `speakerDeviceId: ''`, `speakerLabel: ''`.

## 5. Blast radius
- Satu-satunya pemanggil `reports.approve` di JS adalah Show.jsx. Tak ada perubahan server/migrasi.
- Sink hanya elemen sirine: nada "laporan masuk" & "konfirmasi OPD" tetap ke perangkat bawaan Windows.
- Desktop lama (1.0.1) tak punya jembatan: tetap diam, tanpa error (`?.`).
- Bila kelak admin diberi sirine dari server, speaker berbunyi dua kali - penjaga test kedua mengingatkan.

## 6. Verifikasi
- `DesktopSirineBroadcastTest` (2 test) - dibuktikan merah (jembatan dihapus), dipulihkan `cmp` sama.
- CDP pada Electron (`--user-data-dir` terisolasi, `--remote-debugging-port=9223`):
  jembatan `function` di https://sisupit.com/login; `sirineBroadcast(999)` -> `{aktif:"sirine", paused:false}`;
  setelan tersimpan deviceId basi + nama "Speakers (Realtek(R) Audio)" -> `sinkId` = deviceId nyata;
  speaker hilang -> `ditemukan:false`; mode mati -> diam + log "mode Speaker Damkar mati".
- `npm run build` lulus; suite penuh 893 passed (6760 assertions), baseline 891 sebelum perubahan.
- BELUM: komputer Damkar dengan speaker + headset nyata, panggilan WhatsApp bersamaan.

### Langkah uji manual di komputer Damkar
1. Pasang `dist\Sisupit-Desktop-Setup-1.0.2.exe`, login admin.
2. Windows Sound: Speaker = Default Device, Headset = Default Communication Device; Sound Control Panel >
   Communications = "Do nothing". WhatsApp Desktop > Settings > Calls: mic & speaker = headset.
3. Tray > Speaker sirine Damkar > centang "Bunyikan sirine saat Broadcast..." > pilih speaker > Uji sirine.
4. Telepon WhatsApp sambil Uji sirine: suara panggilan di headset, sirine di speaker, volume tak turun.
5. Broadcast laporan sungguhan/uji dari komputer itu -> sirine di speaker; klik toast = berhenti.

## 7. Rollback
Web: hapus baris jembatan di Show.jsx + test. Desktop: pulihkan `*.bak-task83` atau pasang installer 1.0.1.
