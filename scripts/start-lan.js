/**
 * Avvia Expo con l'IP della rete locale così l'iPhone può connettersi.
 * Uso: node scripts/start-lan.js   oppure  pnpm start:lan
 */
const { spawn } = require('child_process');
const os = require('os');

function getLanIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const ip = iface.address;
        if (ip.startsWith('172.17.') || ip.startsWith('172.18.') || ip.startsWith('172.19.')) continue; // Docker/WSL
        if (ip.startsWith('172.20.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.') || ip.startsWith('172.2') || ip.startsWith('172.3')) {
          candidates.push(ip);
        }
      }
    }
  }
  // Prefer 172.20 (hotspot) and 192.168 (WiFi casa), then 10.x
  const prefer = (a) => (a.startsWith('172.20.') ? 0 : a.startsWith('192.168.') ? 1 : a.startsWith('10.') ? 2 : 3);
  candidates.sort((a, b) => prefer(a) - prefer(b));
  return candidates[0] || '127.0.0.1';
}

const host = getLanIp();
console.log('\n[LAN] Host:', host);
console.log('[LAN] Sul telefono in Expo Go: "Enter URL manually" -> exp://' + host + ':8081\n');

const child = spawn(
  'npx',
  ['expo', 'start', '--clear'],
  {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: host },
    cwd: require('path').resolve(__dirname, '..'),
  }
);

child.on('error', (err) => {
  console.error(err);
  process.exit(1);
});
child.on('exit', (code) => process.exit(code || 0));
