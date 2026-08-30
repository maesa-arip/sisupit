"""
Pembangkit nada notifikasi Sisupit (TASK_50).

Kenapa dibangkitkan, bukan diunduh: berkas dari bank suara menuntut penelusuran lisensi
per berkas dan biasanya jauh lebih besar dari yang dibutuhkan (bandingkan sirine.mp3 =
782 KB). Nada di sini lahir dari angka, jadi lisensinya milik proyek ini, ukurannya kecil,
dan kalau kelak dirasa terlalu tinggi/terlalu panjang cukup ubah satu baris lalu jalankan
ulang — SKRIP INI sumber kebenarannya, bukan berkas .wav hasilnya.

WAV 16-bit mono 44,1 kHz dipilih karena diterima KETIGA permukaan tanpa konversi:
Android res/raw, Chromium (Electron .exe), dan iOS (yang hanya menerima caf/wav/aiff).
Tanpa WAV kita butuh encoder MP3 — dan ffmpeg tidak terpasang di mesin ini.

Jalankan:  python docs/sounds/buat_nada.py
"""

import math
import struct
import wave
from pathlib import Path

# 22,05 kHz, bukan 44,1: isi tertinggi nada-nada di bawah ini adalah harmonik ke-3 dari E6
# (1318,51 × 3 ≈ 3,96 kHz), jauh di bawah batas Nyquist 11 kHz — jadi tak ada satu pun yang
# hilang, sementara ukuran berkasnya separuh. Penting karena masuk_v1 membawa 2,4 detik sunyi
# yang di WAV tetap memakan tempat penuh.
SAMPLE_RATE = 22050
KELUARAN = Path(__file__).parent


def nada(freq, durasi, amp=0.62, harmonik=(1.0, 0.25, 0.08)):
    """Satu nada beramplop raised-cosine.

    Amplop WAJIB: gelombang yang dipotong mendadak berbunyi 'klik' di awal & akhir, dan
    klik itu terdengar seperti kerusakan speaker, bukan seperti notifikasi.
    """
    n = int(SAMPLE_RATE * durasi)
    naik = int(SAMPLE_RATE * 0.006)          # 6 ms
    turun = max(int(n * 0.45), int(SAMPLE_RATE * 0.05))
    keluar = []

    for i in range(n):
        if i < naik:
            env = 0.5 - 0.5 * math.cos(math.pi * i / naik)
        elif i > n - turun:
            sisa = (n - i) / turun
            env = 0.5 - 0.5 * math.cos(math.pi * sisa)
        else:
            env = 1.0

        t = i / SAMPLE_RATE
        s = sum(bobot * math.sin(2 * math.pi * freq * (k + 1) * t) for k, bobot in enumerate(harmonik))
        keluar.append(amp * env * s / sum(harmonik))

    return keluar


def sunyi(durasi):
    return [0.0] * int(SAMPLE_RATE * durasi)


def tulis(nama, contoh):
    puncak = max(abs(x) for x in contoh) or 1.0
    skala = 0.85 / puncak                     # headroom, jangan sampai clipping
    data = b"".join(struct.pack("<h", int(max(-1.0, min(1.0, x * skala)) * 32767)) for x in contoh)

    jalur = KELUARAN / nama
    with wave.open(str(jalur), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        f.writeframes(data)

    print(f"{nama:24s} {len(contoh)/SAMPLE_RATE:5.2f} dtk  {jalur.stat().st_size/1024:6.1f} KB")


# --------------------------------------------------------------- TINGKAT 1: triase
# Laporan warga masuk, BELUM diverifikasi. Pendengarnya Pusat Komando di depan layar.
# Nada NAIK = "ada yang menunggu Anda". Cerah (harmonik ke-2 & ke-3 tebal) supaya menembus
# kebisingan ruangan, tapi pendek dan bernada musikal supaya tidak terbaca darurat.
A5, CIS6, D6, E6 = 880.00, 1108.73, 1174.66, 1318.51

# DIPILIH USER 2026-08-28, dan dipakai BERULANG sampai dibuka. Karena itu berkasnya
# membawa SUNYI EKOR: saat diulang, jedanya ikut terputar sehingga bunyinya berdenting
# tiap ~3,7 detik, bukan menyambung jadi alarm rapat yang dalam sepuluh detik membuat
# orang mematikan notifikasinya untuk selamanya.
#
# Jedanya WAJIB di dalam berkas, bukan di pemutar: di Android pengulangan dikerjakan OS
# lewat FLAG_INSISTENT dan kita tidak punya kendali atas jaraknya sama sekali. Satu
# berkas ber-ekor melayani .exe maupun Android dengan irama yang sama.
tulis("masuk_v1.wav", (
    nada(A5, 0.17) + sunyi(0.05) + nada(D6, 0.22) + sunyi(0.38)
    + nada(A5, 0.17) + sunyi(0.05) + nada(D6, 0.22) + sunyi(2.40)
))

tulis("masuk_v2.wav", (
    nada(A5, 0.15) + sunyi(0.04) + nada(CIS6, 0.15) + sunyi(0.04) + nada(E6, 0.26)
))

# ------------------------------------------------------- TINGKAT 3: kabar koordinasi
# Konfirmasi PLN "listrik sudah dipadamkan", permintaan bantuan OPD. Pendengarnya petugas
# yang SUDAH bekerja di TKP. Nada TURUN = "sesuatu sudah terpenuhi". Lebih murni (nyaris
# tanpa harmonik) dan lebih rendah supaya terbaca tenang — arah nadanyalah yang
# membedakannya dari tingkat 1, dan arah itu terbaca tanpa perlu dihafal.
G5, D5 = 783.99, 587.33

tulis("konfirmasi_v1.wav", (
    nada(D6, 0.20, amp=0.5, harmonik=(1.0, 0.12, 0.0)) + sunyi(0.04)
    + nada(A5, 0.30, amp=0.5, harmonik=(1.0, 0.12, 0.0))
))

# DIPILIH USER 2026-08-28 (yang lebih rendah & lembut). TANPA sunyi ekor: pengulangannya
# berbatas (5×) dan jaraknya diatur pemutar di .exe — beda dari masuk_v1 yang tak berbatas
# dan karena itu harus membawa jedanya sendiri.
tulis("konfirmasi_v2.wav", (
    nada(G5, 0.18, amp=0.5, harmonik=(1.0, 0.10, 0.0)) + sunyi(0.04)
    + nada(D5, 0.32, amp=0.5, harmonik=(1.0, 0.10, 0.0))
))
