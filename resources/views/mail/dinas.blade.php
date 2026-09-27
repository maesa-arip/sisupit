{{--
    Badan surat dinas (TASK_56). Sengaja sederhana & tanpa merek perangkat lunak: yang
    menerima surat ini pejabat, dan kaki "dikirim dari aplikasi X" tidak punya tempat di
    korespondensi resmi.

    Isi & tanda tangan diketik manusia, jadi keduanya di-escape ({{ }}) lalu jeda barisnya
    dipulihkan lewat `nl2br` di CSS (`white-space: pre-line`) — BUKAN lewat {!! !!}. Menerima
    HTML mentah dari isian pengguna berarti siapa pun yang boleh mengirim surat juga boleh
    menyuntikkan markup ke kotak masuk pejabat.
--}}
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $judul }}</title>
</head>
<body style="margin:0; padding:24px; background:#f6f6f6; font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif; color:#1f2937;">
    <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; padding:28px;">
        <div style="white-space:pre-line; font-size:15px; line-height:1.7;">{{ $isi }}</div>

        @if (filled($tandaTangan))
            <div style="margin-top:28px; padding-top:16px; border-top:1px solid #e5e7eb; white-space:pre-line; font-size:14px; line-height:1.6; color:#4b5563;">{{ $tandaTangan }}</div>
        @endif
    </div>
</body>
</html>
