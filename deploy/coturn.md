# coturn (TURN/STUN) untuk Panggilan Sisupit - TASK_90

Panggilan suara Pusat Komando -> pelapor memakai WebRTC. Kedua HP/komputer saling mengirim suara
LANGSUNG bila jaringannya mengizinkan (STUN). Di jaringan seluler Indonesia (CGNAT) dan sebagian Wi-Fi
kantor, jalur langsung gagal - suaranya harus diteruskan server TURN. Tanpa TURN: sebagian panggilan
berdering, dijawab, lalu "Gagal tersambung".

Beban: suara Opus ~40-60 kbit/s per arah per panggilan yang lewat TURN. Panggilan bersamaan di Damkar
hanya hitungan jari, jadi VPS 1 inti cukup. Semua komponen gratis (coturn open source).

## Cara cepat (dipakai 2026-11-17)

`bash deploy/coturn-setup.sh /var/www/sisupit-staging` - memasang coturn, membuka port di ufw, dan mengisi
`WEBRTC_STUN_URLS`/`TURN_URLS`/`TURN_SECRET` di `.env` environment itu memakai IP VPS `31.97.110.62` (tanpa DNS baru).
coturn jalan sebagai container Docker `coturn/coturn:4.6.2` (`--network host`), BUKAN paket apt: di VPS ini
`apt-get install coturn` ikut menarik upgrade `mysql-server-8.0` (database ketiga environment) - JANGAN pakai apt.
Aman diulang; untuk prod jalankan lagi dengan `/var/www/sisupit` (rahasia yang sama dipakai ulang). Bila Hostinger
memasang firewall di panel (VPS > Keamanan > Firewall), buka juga UDP 3478 & 49160-49200 dan TCP 3478 di sana.

## 1. Pasang manual (rincian yang dikerjakan skrip)

```bash
apt-get update && apt-get install -y coturn
sed -i 's/^#\?TURNSERVER_ENABLED=.*/TURNSERVER_ENABLED=1/' /etc/default/coturn
RAHASIA=$(openssl rand -hex 32); echo "TURN_SECRET=$RAHASIA"   # simpan, dipakai di .env

cat > /etc/turnserver.conf <<CONF
listening-port=3478
fingerprint
use-auth-secret
static-auth-secret=$RAHASIA
realm=sisupit.com
# Rentang port relay - buka juga di firewall.
min-port=49160
max-port=49200
# Hanya meneruskan ke alamat publik (cegah TURN dipakai menembus jaringan internal VPS).
no-multicast-peers
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
no-cli
total-quota=50
user-quota=4
log-file=/var/log/turnserver.log
simple-log
CONF

systemctl enable --now coturn
```

Firewall (sesuaikan bila memakai ufw/iptables):

```bash
ufw allow 3478/udp && ufw allow 3478/tcp && ufw allow 49160:49200/udp
```

DNS: buat record `A turn.sisupit.com` -> IP VPS (atau pakai IP langsung di TURN_URLS).

## 2. Isi .env tiap environment (prod/staging/dev memakai coturn yang sama)

```
TURN_URLS=turn:turn.sisupit.com:3478?transport=udp,turn:turn.sisupit.com:3478?transport=tcp
TURN_SECRET=<RAHASIA dari langkah 1>
WEBRTC_STUN_URLS=stun:turn.sisupit.com:3478
```

Lalu `php artisan config:cache` (deploy-env.sh sudah menjalankannya). TANPA rebuild frontend:
server ICE dikirim server per panggilan (`ReporterCall::iceServers`), kredensial berlaku 1 jam.

## 3. Uji

- Buka https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/ , isi
  `turn:turn.sisupit.com:3478`, username & password dari `GET /panggilan/ice` (login admin, buka di browser),
  klik "Gather candidates" - harus muncul kandidat bertipe **relay**.
- Uji panggilan nyata: admin di komputer kantor, pelapor di HP memakai data seluler (Wi-Fi mati).

## Catatan

- TLS (`turns:` 5349) belum dipasang - sebagian jaringan kantor yang hanya membuka 443 akan gagal.
  Bila dibutuhkan: `cert`/`pkey` coturn ke sertifikat Let's Encrypt `turn.sisupit.com`, `tls-listening-port=5349`,
  tambahkan `turns:turn.sisupit.com:5349?transport=tcp` di TURN_URLS.
- Isi suara TIDAK direkam di mana pun; coturn hanya meneruskan paket terenkripsi (DTLS-SRTP).
