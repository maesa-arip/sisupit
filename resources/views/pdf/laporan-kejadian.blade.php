{{--
    PDF Laporan Kejadian (TASK_68). Dirender dompdf di server - hanya CSS 2.1 sederhana (tabel,
    tanpa flex/grid) dan font DejaVu Sans bawaan dompdf (memuat "±", yang dipakai kolom kerugian
    & volume air). Semua isian lewat {{ }} (ter-escape): isinya diketik petugas.
    KTP korban SENGAJA tidak ada di dokumen ini - lihat ReportResolutionController::pdf().
--}}
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Kejadian {{ $nomor }}</title>
    <style>
        @page { margin: 28px 36px 48px 36px; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; color: #111; line-height: 1.45; }
        .kop { text-align: center; border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 12px; }
        .kop .instansi { font-size: 14px; font-weight: bold; text-transform: uppercase; }
        .kop .alamat { font-size: 9px; color: #444; }
        h1 { font-size: 13px; text-align: center; margin: 0; letter-spacing: 1px; }
        .sub { text-align: center; font-size: 10px; margin: 2px 0 10px; }
        .badge { display: inline-block; padding: 1px 6px; border: 1px solid #111; font-weight: bold; font-size: 9px; }
        .arsip { color: #b45309; border-color: #b45309; }
        table { width: 100%; border-collapse: collapse; }
        .kv td { padding: 3px 4px; vertical-align: top; }
        .kv td.k { width: 30%; color: #444; }
        .kv td.s { width: 2%; }
        h2 { font-size: 10.5px; margin: 12px 0 4px; padding-bottom: 2px; border-bottom: 1px solid #999; text-transform: uppercase; }
        .grid th, .grid td { border: 1px solid #999; padding: 3px 4px; text-align: left; vertical-align: top; }
        .grid th { background: #eee; font-size: 9px; }
        .para { white-space: pre-line; }
        .muted { color: #666; }
        .photos td { width: 33%; padding: 3px; text-align: center; vertical-align: top; }
        .photos img { max-width: 100%; max-height: 130px; }
        .ttd { margin-top: 24px; page-break-inside: avoid; }
        .ttd td { width: 50%; text-align: center; vertical-align: top; }
        .footer { position: fixed; bottom: -30px; left: 0; right: 0; font-size: 8px; color: #666; border-top: 1px solid #ccc; padding-top: 3px; }
    </style>
</head>
<body>
    <div class="footer">
        {{ $nomor }} &middot; Dicetak {{ $printedAt->format('d-m-Y H:i') }} WITA oleh {{ $printedBy }} &middot; Sisupit
    </div>

    <div class="kop">
        <div class="instansi">{{ $tenant->nama_instansi }}</div>
        @if (! empty($tenant->alamat_instansi))
            <div class="alamat">{{ $tenant->alamat_instansi }}</div>
        @endif
    </div>

    <h1>LAPORAN KEJADIAN</h1>
    <div class="sub">
        No. {{ $nomor }} &nbsp;
        <span class="badge">{{ $resolution->status === 'final' ? 'FINAL' : 'SEMENTARA' }}</span>
        @unless ($isActive)
            <span class="badge arsip">ARSIP - VERSI LAMA</span>
        @endunless
    </div>

    <table class="kv">
        <tr><td class="k">Jenis Kejadian</td><td class="s">:</td><td>{{ $resolution->jenis_kejadian ?: '-' }}</td></tr>
        <tr><td class="k">Sumber Informasi</td><td class="s">:</td><td>{{ $resolution->sumber_informasi ?: '-' }}</td></tr>
        <tr><td class="k">Waktu Kejadian</td><td class="s">:</td><td>{{ $occurredAt ? $occurredAt->format('d-m-Y H:i').' WITA' : '-' }}</td></tr>
        <tr><td class="k">Alamat</td><td class="s">:</td><td>{{ $resolution->lokasi_alamat ?: '-' }}</td></tr>
        <tr><td class="k">Desa/Kelurahan</td><td class="s">:</td><td>{{ $resolution->kelurahan ?: '-' }}</td></tr>
        <tr><td class="k">Kecamatan</td><td class="s">:</td><td>{{ $resolution->kecamatan ?: '-' }}</td></tr>
        <tr>
            <td class="k">Pemilik Lahan/Rumah</td><td class="s">:</td>
            <td>{{ $resolution->pemilik_nama ?: '-' }}@if ($resolution->pemilik_umur) ({{ $resolution->pemilik_umur }} tahun)@endif</td>
        </tr>
        <tr><td class="k">Estimasi Kerugian</td><td class="s">:</td><td>{{ $resolution->kerugian ?: '-' }}</td></tr>
        <tr><td class="k">Volume Air Digunakan</td><td class="s">:</td><td>{{ $resolution->volume_air ?: '-' }}</td></tr>
    </table>

    <h2>Tim yang Atensi di TKP</h2>
    <div class="para">{{ $resolution->tim_atensi ?: '-' }}</div>

    <h2>Kronologi / Keterangan</h2>
    <div class="para">{{ $resolution->kronologi ?: '-' }}</div>

    <h2>Korban ({{ $resolution->victims->count() }})</h2>
    @if ($resolution->victims->isEmpty())
        <div class="muted">Tidak ada korban tercatat.</div>
    @else
        <table class="grid">
            <tr><th style="width:4%">No</th><th style="width:24%">Nama</th><th style="width:14%">Tgl. Lahir</th><th style="width:28%">Alamat</th><th>Kondisi</th></tr>
            @foreach ($resolution->victims as $i => $victim)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $victim->nama ?: '-' }}</td>
                    <td>{{ $victim->tanggal_lahir ? $victim->tanggal_lahir->format('d-m-Y') : '-' }}</td>
                    <td>{{ $victim->alamat ?: '-' }}</td>
                    <td>{{ $victim->kondisi ?: '-' }}</td>
                </tr>
            @endforeach
        </table>
    @endif

    @if ($photos->isNotEmpty())
        <h2>Foto Kejadian ({{ $photos->count() }})</h2>
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
        <div class="muted">{{ $photosSkipped }} foto tidak dapat disertakan di dokumen ini; lihat di aplikasi.</div>
    @endif

    <div class="muted" style="margin-top:10px">
        Dibuat oleh {{ optional($resolution->creator)->name ?? 'tidak tercatat' }}
        @if ($createdAt) pada {{ $createdAt->format('d-m-Y H:i') }} WITA @endif
        @if ($lastEdit)
            &middot; terakhir diubah oleh {{ $lastEdit->user_name }} pada {{ $lastEditAt->format('d-m-Y H:i') }} WITA
        @endif
    </div>

    <table class="ttd">
        <tr>
            <td>
                Dibuat oleh,<br><br><br><br>
                <b>{{ optional($resolution->creator)->name ?? '....................' }}</b>
            </td>
            <td>
                Mengetahui,<br>{{ $tenant->pejabat_jabatan ?: 'Kepala Dinas' }}<br><br><br>
                <b>{{ $tenant->pejabat_nama ?: '....................' }}</b>
            </td>
        </tr>
    </table>
</body>
</html>
