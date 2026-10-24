@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
{{-- Logo petir Sisupit di atas nama aplikasi (dulu teks APP_NAME saja). Gambar SISIPAN: berkasnya
     dilampirkan App\Listeners\SisipkanLogoEmail saat kirim; tautan ke /icon.png tampil rusak di Gmail. --}}
<img src="cid:sisupit-logo" class="logo" width="48" height="48" alt="Sisupit" style="height: 48px; max-height: 48px; width: 48px; border-radius: 10px;">
<br>
{{ $slot }}
</a>
</td>
</tr>
