{{--
    PDF Laporan Kejadian (TASK_68). Dirender dompdf di server - hanya CSS 2.1 sederhana (tabel,
    tanpa flex/grid) dan font DejaVu Sans bawaan dompdf (memuat "±", yang dipakai kolom kerugian
    & volume air). Semua isian lewat {{ }} (ter-escape): isinya diketik petugas.
    KTP korban SENGAJA tidak ada di dokumen ini - lihat ReportResolutionController::pdf().

    Tata naskah dinas (2026-11-19, permintaan user "profesional pemerintahan"): kop surat resmi
    ($kopImage, per tenant - ReportResolutionController::KOP_IMAGES; tanpa gambar = kop teks +
    lambang Damkar), garis kop ganda, bagian berhuruf A-E, blok tanda tangan bertempat-tanggal
    + NIP. Tanda Sisupit TETAP di footer kanan (#233).
--}}
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Kejadian {{ $nomor }}</title>
    <style>
        @page { margin: 30px 44px 62px 44px; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 9.5px; color: #1a1a1a; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; }

        /* Kop surat */
        .kop-img { width: 100%; }
        .kop-img img { width: 100%; }
        .kop-teks td { vertical-align: middle; line-height: 1.3; }
        .kop-teks .lambang { width: 64px; text-align: center; }
        .kop-teks .lambang img { width: 58px; height: 58px; }
        .kop-teks .tengah { text-align: center; }
        .kop-teks .pemerintah { font-size: 11px; font-weight: bold; letter-spacing: 0.5px; }
        .kop-teks .instansi { font-size: 13.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px; }
        .kop-teks .alamat { font-size: 8.5px; color: #333; }
        .garis-kop { border-top: 2.5px solid #000; border-bottom: 0.8px solid #000; height: 1.5px; margin: 4px 0 14px; }

        /* Judul naskah */
        .judul { text-align: center; margin-bottom: 12px; }
        .judul h1 { font-size: 13px; margin: 0; letter-spacing: 2px; text-decoration: underline; }
        .judul .nomor { font-size: 9.5px; margin-top: 3px; }
        .badge { display: inline-block; padding: 1px 7px; border: 1px solid #1f3a68; color: #1f3a68; font-weight: bold; font-size: 8px; letter-spacing: 0.5px; }
        .arsip { color: #b45309; border-color: #b45309; }

        /* Bagian */
        h2 { font-size: 9.5px; margin: 14px 0 5px; padding: 3px 6px; background: #1f3a68; color: #fff; text-transform: uppercase; letter-spacing: 0.6px; }
        .kv td { padding: 3px 6px; vertical-align: top; border-bottom: 0.5px solid #dde3ec; }
        .kv td.k { width: 30%; color: #333; }
        .kv td.s { width: 2%; padding-left: 0; padding-right: 0; }
        .kv td.v { font-weight: bold; }
        .para { white-space: pre-line; padding: 2px 6px; }
        .grid th, .grid td { border: 0.8px solid #9aa6b8; padding: 3px 5px; text-align: left; vertical-align: top; }
        .grid th { background: #e8edf5; font-size: 8.5px; color: #1f3a68; text-transform: uppercase; }
        .grid td.no { text-align: center; }
        .muted { color: #666; }
        .kosong { padding: 2px 6px; color: #666; font-style: italic; }
        .photos td { width: 33%; padding: 4px; text-align: center; vertical-align: top; }
        .photos img { max-width: 100%; max-height: 130px; border: 0.8px solid #ccc; }
        .jejak { margin-top: 12px; font-size: 8px; color: #555; border-left: 2px solid #9aa6b8; padding-left: 6px; }

        /* Tanda tangan */
        .ttd { margin-top: 26px; page-break-inside: avoid; }
        .ttd td { width: 50%; text-align: center; vertical-align: top; }
        .ttd .ruang { height: 56px; }
        .ttd .nama { font-weight: bold; text-decoration: underline; }

        /* Footer: identitas dokumen kiri, tanda Sisupit kanan (kecil & abu supaya kop tetap utama). */
        .footer { position: fixed; bottom: -40px; left: 0; right: 0; font-size: 7.5px; color: #666; border-top: 0.8px solid #9aa6b8; padding-top: 4px; }
        .footer td { padding: 0; vertical-align: middle; }
        .footer .merek { text-align: right; color: #999; white-space: nowrap; }
        .footer .merek img { width: 9px; height: 9px; vertical-align: middle; margin-right: 2px; }
    </style>
</head>
<body>
    <div class="footer">
        <table>
            <tr>
                <td>
                    {{ $nomor }} &middot; Dicetak {{ $printedAt->format('d-m-Y H:i') }} WITA oleh {{ $printedBy }}
                </td>
                <td class="merek">@if (! empty($brandLogo))<img src="{{ $brandLogo }}" alt="">@endif Dibuat dengan Sisupit &middot; sisupit.com</td>
            </tr>
        </table>
    </div>

    @if (! empty($kopImage))
        <div class="kop-img"><img src="{{ $kopImage }}" alt="Kop {{ $tenant->nama_instansi }}"></div>
    @else
        <table class="kop-teks">
            <tr>
                <td class="lambang">@if (! empty($damkarLogo))<img src="{{ $damkarLogo }}" alt="">@endif</td>
                <td class="tengah">
                    @if (! empty($pemerintahLabel))
                        <div class="pemerintah">{{ $pemerintahLabel }}</div>
                    @endif
                    <div class="instansi">{{ $tenant->nama_instansi }}</div>
                    @if (! empty($tenant->alamat_instansi))
                        <div class="alamat">{{ $tenant->alamat_instansi }}</div>
                    @endif
                </td>
                <td class="lambang"></td>
            </tr>
        </table>
    @endif
    <div class="garis-kop"></div>

    <div class="judul">
        <h1>LAPORAN KEJADIAN</h1>
        <div class="nomor">
            Nomor: {{ $nomor }} &nbsp;
            <span class="badge">{{ $resolution->status === 'final' ? 'FINAL' : 'SEMENTARA' }}</span>
            @unless ($isActive)
                <span class="badge arsip">ARSIP - VERSI LAMA</span>
            @endunless
        </div>
    </div>

    <h2>A. Data Kejadian</h2>
    <table class="kv">
        <tr><td class="k">Jenis Kejadian</td><td class="s">:</td><td class="v">{{ $resolution->jenis_kejadian ?: '-' }}</td></tr>
        <tr><td class="k">Sumber Informasi</td><td class="s">:</td><td class="v">{{ $resolution->sumber_informasi ?: '-' }}</td></tr>
        <tr><td class="k">Waktu Kejadian</td><td class="s">:</td><td class="v">{{ $occurredAt ? $occurredAt->format('d-m-Y H:i').' WITA' : '-' }}</td></tr>
        <tr><td class="k">Alamat</td><td class="s">:</td><td class="v">{{ $resolution->lokasi_alamat ?: '-' }}</td></tr>
        <tr><td class="k">Desa/Kelurahan</td><td class="s">:</td><td class="v">{{ $resolution->kelurahan ?: '-' }}</td></tr>
        <tr><td class="k">Kecamatan</td><td class="s">:</td><td class="v">{{ $resolution->kecamatan ?: '-' }}</td></tr>
        <tr>
            <td class="k">Pemilik Lahan/Rumah</td><td class="s">:</td>
            <td class="v">{{ $resolution->pemilik_nama ?: '-' }}@if ($resolution->pemilik_umur) ({{ $resolution->pemilik_umur }} tahun)@endif</td>
        </tr>
        <tr><td class="k">Estimasi Kerugian</td><td class="s">:</td><td class="v">{{ $resolution->kerugianLabel() ?: '-' }}</td></tr>
        <tr><td class="k">Volume Air Digunakan</td><td class="s">:</td><td class="v">{{ $resolution->volume_air ?: '-' }}</td></tr>
    </table>

    <h2>B. Tim yang Atensi di TKP</h2>
    <div class="para">{{ $resolution->tim_atensi ?: '-' }}</div>

    <h2>C. Kronologi / Keterangan</h2>
    <div class="para">{{ $resolution->kronologi ?: '-' }}</div>

    <h2>D. Korban ({{ $resolution->victims->count() }})</h2>
    @if ($resolution->victims->isEmpty())
        <div class="kosong">Tidak ada korban tercatat.</div>
    @else
        <table class="grid">
            <tr><th style="width:5%">No</th><th style="width:24%">Nama</th><th style="width:14%">Tgl. Lahir</th><th style="width:28%">Alamat</th><th>Kondisi</th></tr>
            @foreach ($resolution->victims as $i => $victim)
                <tr>
                    <td class="no">{{ $i + 1 }}</td>
                    <td>{{ $victim->nama ?: '-' }}</td>
                    <td>{{ $victim->tanggal_lahir ? $victim->tanggal_lahir->format('d-m-Y') : '-' }}</td>
                    <td>{{ $victim->alamat ?: '-' }}</td>
                    <td>{{ $victim->kondisi ?: '-' }}</td>
                </tr>
            @endforeach
        </table>
    @endif

    @if ($photos->isNotEmpty() || $photosSkipped > 0)
        <h2>E. Dokumentasi Foto ({{ $photos->count() + $photosSkipped }})</h2>
        @if ($photos->isNotEmpty())
            <table class="photos">
                @foreach ($photos->chunk(3) as $row)
                    <tr>
                        @foreach ($row as $src)
                            <td><img src="{{ $src }}" alt="Foto kejadian"></td>
                        @endforeach
                        @for ($pad = $row->count(); $pad < 3; $pad++)<td></td>@endfor
                    </tr>
                @endforeach
            </table>
        @endif
        @if ($photosSkipped > 0)
            <div class="kosong">{{ $photosSkipped }} foto tidak dapat disertakan di dokumen ini; lihat di aplikasi.</div>
        @endif
    @endif

    <div class="jejak">
        Dibuat oleh {{ optional($resolution->creator)->name ?? 'tidak tercatat' }}
        @if ($createdAt) pada {{ $createdAt->format('d-m-Y H:i') }} WITA @endif
        @if ($lastEdit)
            &middot; terakhir diubah oleh {{ $lastEdit->user_name }} pada {{ $lastEditAt->format('d-m-Y H:i') }} WITA
        @endif
    </div>

    <table class="ttd">
        <tr>
            <td>
                &nbsp;<br>&nbsp;<br>
                Yang Membuat Laporan,
                <div class="ruang"></div>
                <div class="nama">{{ optional($resolution->creator)->name ?? '....................' }}</div>
                NIP. ..............................
            </td>
            <td>
                {{ $placeName ?? '....................' }}, {{ $printedAt->copy()->locale('id')->translatedFormat('j F Y') }}<br>
                Mengetahui,<br>{{ $tenant->pejabat_jabatan ?: 'Kepala Dinas' }}
                <div class="ruang"></div>
                <div class="nama">{{ $tenant->pejabat_nama ?: '....................' }}</div>
                NIP. ..............................
            </td>
        </tr>
    </table>
</body>
</html>
