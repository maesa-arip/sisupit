# Menyalakan SEMUA yang dibutuhkan untuk development Sisupit di mesin lokal (Laragon, Windows).
#
#   npm run dev:all              # semuanya
#   npm run dev:all -- -NoDocker # tanpa Nominatim/OSRM/tile (mis. Docker sedang tak dipakai)
#
# Yang dinyalakan:
#   1. Docker Desktop (bila mati) + container sisupit-nominatim (:8080), sisupit-osrm (:5001),
#      sisupit-tiles (:8081) lewat docker compose masing-masing.
#   2. Satu jendela berisi tiga proses (concurrently), Ctrl+C menghentikan ketiganya:
#      reverb (WebSocket, port REVERB_SERVER_PORT), queue (notifikasi diantrekan - tanpa ini
#      notifikasi darurat tak pernah terkirim), dan vite (npm run dev).
#
# Yang TIDAK dinyalakan: web server & MySQL - itu milik Laragon (aplikasi dilayani di APP_URL,
# mis. https://sisupit.test), jadi di sini hanya DIPERIKSA. `php artisan serve` sengaja tak dipakai.
#
# Kenapa bukan `composer dev`: script itu menjalankan `php artisan serve` (origin berbeda dari
# APP_URL Laragon) dan `php artisan pail`, yang butuh ekstensi pcntl - tidak ada di PHP Windows -
# serta tidak menyalakan Reverb.

param(
	[switch]$NoDocker
)

# 'Continue', BUKAN 'Stop': di PowerShell 5.1 perintah native yang menulis ke stderr (docker compose
# menulis progresnya di sana) dianggap galat oleh 'Stop' dan skrip berhenti padahal berhasil.
# Kegagalan dibaca dari $LASTEXITCODE.
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Write-Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }
function Write-Ok($text) { Write-Host "    OK  $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "    !!  $text" -ForegroundColor Yellow }

# Port sedang DIDENGARKAN proses mana pun, IPv4 MAUPUN IPv6. Vite mendengarkan di `::1`
# (localhost IPv6), jadi mencoba tersambung ke 127.0.0.1 akan melaporkannya "bebas" - lalu
# skrip menyalakan Vite KEDUA yang diam-diam merebut public/hot dari Vite yang sudah jalan
# (terjadi saat skrip ini pertama diuji, 2026-09-27).
function Test-Port([int]$port) {
	return [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
}

function Get-EnvValue([string]$key, [string]$default) {
	$line = Get-Content (Join-Path $root '.env') | Where-Object { $_ -match "^$key=" } | Select-Object -First 1
	if (-not $line) { return $default }
	return ($line -replace "^$key=", '').Trim('"')
}

# --- 1. Prasyarat ---------------------------------------------------------------------------
Write-Step 'Memeriksa prasyarat'

if (-not (Test-Path (Join-Path $root 'node_modules\.bin\concurrently.cmd'))) {
	Write-Warn 'node_modules belum lengkap (concurrently/vite tidak ditemukan). Menjalankan npm ci...'
	npm ci --no-audit --no-fund
	if ($LASTEXITCODE -ne 0) { throw 'npm ci gagal.' }
}
Write-Ok 'node_modules lengkap'

if (Test-Port 3306) { Write-Ok 'MySQL (3306) hidup' } else { Write-Warn 'MySQL (3306) MATI - nyalakan Laragon (Start All).' }
if ((Test-Port 443) -or (Test-Port 80)) { Write-Ok 'Web server Laragon hidup' } else { Write-Warn 'Web server Laragon MATI - nyalakan Laragon (Start All).' }

# --- 2. Docker: Nominatim, OSRM, tile peta ----------------------------------------------------
if ($NoDocker) {
	Write-Step 'Docker dilewati (-NoDocker): geocoding, rute, dan peta tidak akan tersedia'
} else {
	Write-Step 'Menyalakan layanan Docker (Nominatim, OSRM, tile peta)'

	cmd /c "docker info >nul 2>&1"
	if ($LASTEXITCODE -ne 0) {
		$desktop = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
		if (-not (Test-Path $desktop)) { throw "Docker Desktop tidak ditemukan di $desktop. Jalankan ulang dengan -NoDocker." }
		Write-Host '    Docker Desktop mati, menyalakan... (bisa sampai 1-2 menit)'
		Start-Process $desktop
		$deadline = (Get-Date).AddSeconds(180)
		do {
			Start-Sleep -Seconds 3
			cmd /c "docker info >nul 2>&1"
		} while ($LASTEXITCODE -ne 0 -and (Get-Date) -lt $deadline)
		if ($LASTEXITCODE -ne 0) { throw 'Docker Desktop belum siap setelah 3 menit. Coba lagi, atau jalankan dengan -NoDocker.' }
	}
	Write-Ok 'Docker siap'

	# `up -d` idempoten: container yang sudah ada cukup dinyalakan. (Kalau container
	# sisupit-nominatim belum pernah dibuat, perintah ini memulai IMPOR data Bali yang lama -
	# lihat docker/nominatim.)
	foreach ($svc in @('nominatim', 'osrm', 'tiles')) {
		docker compose -f (Join-Path $root "docker\$svc\docker-compose.yml") up -d
		if ($LASTEXITCODE -ne 0) { Write-Warn "gagal menyalakan $svc" } else { Write-Ok "sisupit-$svc menyala" }
	}
}

# --- 3. Reverb + queue + Vite dalam satu jendela ---------------------------------------------
# Proses yang SUDAH jalan (mis. `npm run dev` di terminal lain) dilewati, bukan dinyalakan dua kali.
$reverbPort = [int](Get-EnvValue 'REVERB_SERVER_PORT' (Get-EnvValue 'REVERB_PORT' '8080'))
$names = @()
$colors = @()
$commands = @()

if (Test-Port $reverbPort) {
	Write-Warn "Port $reverbPort sudah didengarkan - Reverb dianggap sudah jalan, dilewati. (Kalau itu BUKAN Reverb, portnya bentrok - lihat FINDINGS #130: 8080 milik Nominatim.)"
} else {
	$names += 'reverb'; $colors += '#c4b5fd'; $commands += 'php artisan reverb:start'
}

$names += 'queue'; $colors += '#fdba74'; $commands += 'php artisan queue:listen --tries=1'

if (Test-Port 5173) {
	Write-Warn 'Vite sudah jalan di 5173 (npm run dev di terminal lain) - dilewati, supaya public/hot tak direbut Vite kedua.'
} else {
	$names += 'vite'; $colors += '#93c5fd'; $commands += 'npm run dev'
}

Write-Step "Menjalankan $($names -join ' + ') (Ctrl+C untuk berhenti semua)"
Write-Host "    Aplikasi: $(Get-EnvValue 'APP_URL' 'https://sisupit.test')"

& (Join-Path $root 'node_modules\.bin\concurrently.cmd') --names ($names -join ',') -c ($colors -join ',') @commands
