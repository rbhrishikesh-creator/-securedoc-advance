const http = require('http');
const { execSync } = require('child_process');

function checkHttp(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 400,
          status: res.statusCode,
          data
        });
      });
    });
    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ ok: false, error: 'Timeout' });
    });
  });
}

async function checkMongo() {
  try {
    const out = execSync('sc query MongoDB', { encoding: 'utf8' });
    return out.includes('RUNNING') ? 'RUNNING' : 'STOPPED';
  } catch {
    return 'UNKNOWN';
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('  📊  SecureDoc Advanced - Health & Availability Check');
  console.log('======================================================\n');

  const mongoStatus = await checkMongo();
  console.log(`[Database] MongoDB Service:    ${mongoStatus === 'RUNNING' ? '✅ RUNNING' : '⚠️ ' + mongoStatus}`);

  const backend = await checkHttp('http://localhost:5050/api/health');
  if (backend.ok) {
    console.log(`[Backend]  Express REST API:    ✅ ONLINE (Port 5050 - ${backend.data.trim()})`);
  } else {
    console.log(`[Backend]  Express REST API:    ❌ OFFLINE (${backend.error || 'Status ' + backend.status})`);
  }

  const frontend = await checkHttp('http://localhost:5174/');
  if (frontend.ok) {
    console.log(`[Frontend] React/Vite Client:   ✅ ONLINE (Port 5174 - HTTP ${frontend.status})`);
  } else {
    console.log(`[Frontend] React/Vite Client:   ❌ OFFLINE (${frontend.error || 'Status ' + frontend.status})`);
  }

  console.log('\nAccess Points:');
  console.log('  🌐 Application URL:  http://localhost:5174');
  console.log('  🩺 Health API:       http://localhost:5050/api/health');
  console.log('  🔐 Admin Account:    rbhrishikesh@gmail.com / Kesh@123\n');
}

main();
