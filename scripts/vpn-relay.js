/**
 * TCP relay: meneruskan koneksi dari laptop (LAN) ke backend kampus lewat VPN.
 *
 * Kenapa perlu: backend (10.33.33.11) hanya bisa diakses lewat VPN "servers ai"
 * yang terpasang di LAPTOP. HP tidak punya VPN, jadi HP cukup konek ke laptop
 * (satu WiFi) dan relay ini meneruskan trafiknya ke server.
 *
 *   HP (Expo Go) ──WiFi──> laptop:8000 (relay ini) ──VPN──> 10.33.33.11:8000
 *
 * Jalankan:  node scripts/vpn-relay.js
 * Prasyarat: VPN "servers ai" tersambung di laptop (cek: rasdial).
 */
const net = require('net');

const LISTEN_HOST = '0.0.0.0';
const LISTEN_PORT = Number(process.env.RELAY_PORT || 8000);
const TARGET_HOST = process.env.RELAY_TARGET_HOST || '10.33.33.11';
const TARGET_PORT = Number(process.env.RELAY_TARGET_PORT || 8000);

const server = net.createServer((client) => {
  const upstream = net.connect(TARGET_PORT, TARGET_HOST);

  const closeBoth = () => {
    client.destroy();
    upstream.destroy();
  };

  client.pipe(upstream);
  upstream.pipe(client);

  client.on('error', closeBoth);
  upstream.on('error', (err) => {
    console.error(`[relay] gagal ke ${TARGET_HOST}:${TARGET_PORT} — ${err.code || err.message} (VPN tersambung?)`);
    closeBoth();
  });
  client.on('close', closeBoth);
  upstream.on('close', closeBoth);
});

server.on('error', (err) => {
  console.error(`[relay] tidak bisa listen di port ${LISTEN_PORT}: ${err.code || err.message}`);
  process.exit(1);
});

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
  console.log(`[relay] listening di ${LISTEN_HOST}:${LISTEN_PORT} -> ${TARGET_HOST}:${TARGET_PORT}`);
  console.log('[relay] pastikan VPN "servers ai" tersambung di laptop ini.');
});

