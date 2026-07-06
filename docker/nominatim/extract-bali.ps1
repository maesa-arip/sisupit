# Ekstrak wilayah BALI dari file PBF Indonesia menjadi bali.osm.pbf.
#
# Kenapa diekstrak: import Nominatim seluruh Indonesia (~1.7 GB) butuh 1-3 jam +
# disk besar. Bali saja jadi ~30-60 MB dan import ~10-20 menit - cukup untuk
# aplikasi yang (untuk sekarang) hanya beroperasi di Bali.
#
# Bounding box Bali (sudah termasuk Nusa Penida, TIDAK termasuk Lombok):
#   barat=114.40  selatan=-8.90  timur=115.75  utara=-8.03
#
# Prasyarat: Docker Desktop TERPASANG dan SEDANG BERJALAN.
# Jalankan dari folder mana pun:
#   powershell -File docker\nominatim\extract-bali.ps1
#
# Untuk NEXT STEP (seluruh Indonesia): lewati skrip ini, cukup taruh file
# indonesia-*.osm.pbf di docker/nominatim/data/ dan set PBF_FILENAME di .env.

$ErrorActionPreference = "Stop"

# --- Konfigurasi (ubah bila lokasi file berbeda) ---
$SrcDir   = "C:\laragon\www\nominatim-sisupit"
$SrcFile  = "indonesia-260524.osm.pbf"
$OutDir   = Join-Path $PSScriptRoot "data"
$OutFile  = "bali.osm.pbf"
$Bbox     = "114.40,-8.90,115.75,-8.03"

# --- Validasi ---
$srcPath = Join-Path $SrcDir $SrcFile
if (-not (Test-Path $srcPath)) {
    Write-Error "File sumber tidak ditemukan: $srcPath"
    exit 1
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker tidak ditemukan di PATH. Install & jalankan Docker Desktop dulu."
    exit 1
}
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker daemon tidak berjalan. Buka Docker Desktop lalu ulangi."
    exit 1
}
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

Write-Host "Mengekstrak Bali dari $SrcFile (bbox $Bbox)..." -ForegroundColor Cyan
Write-Host "Ini butuh beberapa menit tergantung CPU/disk. Tunggu..." -ForegroundColor Cyan

# osmium-tool dijalankan di dalam container debian (install sekali saat run) supaya
# tidak perlu memasang binary osmium di Windows dan tidak bergantung image pihak ketiga.
#
# --strategy smart -S types=multipolygon,boundary : WAJIB.
# Strategi default memotong relasi batas administrasi. 'smart' saja pun secara default HANYA
# melengkapi relasi type=multipolygon, BUKAN type=boundary. Boundary provinsi Bali (admin_level 4)
# adalah type=boundary yang batasnya menjulur ke laut di luar bbox, jadi tanpa opsi ini ia
# terpotong -> polygon-nya tak tertutup -> Nominatim tak bisa hitung "state=Bali" -> auto-fill
# provinsi di form lapor gagal (kota/kecamatan/desa ikut kosong karena cascade). Opsi 'boundary'
# memaksa smart menarik relasi boundary secara utuh walau keluar bbox.
docker run --rm `
    -v "${SrcDir}:/src:ro" `
    -v "${OutDir}:/out" `
    debian:bookworm-slim `
    bash -c "apt-get update -qq && apt-get install -y -qq osmium-tool >/dev/null && osmium extract --strategy smart -S types=multipolygon,boundary -b $Bbox /src/$SrcFile -o /out/$OutFile --overwrite && osmium fileinfo /out/$OutFile"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Ekstraksi gagal (lihat pesan di atas)."
    exit 1
}

$out = Join-Path $OutDir $OutFile
$sizeMB = [math]::Round((Get-Item $out).Length / 1MB, 1)
Write-Host ""
Write-Host "Selesai: $out ($sizeMB MB)" -ForegroundColor Green
Write-Host "Lanjut: cd docker\nominatim; docker compose up -d   (pantau: docker compose logs -f)" -ForegroundColor Green
