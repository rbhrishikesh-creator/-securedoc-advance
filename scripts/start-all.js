const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SERVER_DIR = path.join(ROOT_DIR, 'server');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');

function checkHttp(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    }).on('error', () => {
      resolve(false);
    });
  });
}

function freePort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const lines = output.trim().split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const proto = parts[0];
      const localAddr = parts[1] || '';
      const pid = parts[parts.length - 1];
      if (proto.startsWith('TCP') && localAddr.endsWith(`:${port}`) && pid && pid !== '0') {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`[Port Clean] Freed port ${port} (PID ${pid})`);
        } catch {}
      }
    }
  } catch {}
}

async function waitForHealth(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const isUp = await checkHttp(url);
    if (isUp) return true;
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

function openBrowser(url) {
  try {
    const startCmd = process.platform === 'win32' ? `start "" "${url}"` : `open "${url}"`;
    execSync(startCmd);
  } catch (err) {
    console.log(`Open in browser: ${url}`);
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('  🛡️  SecureDoc Advanced - Availability Guardian');
  console.log('======================================================\n');

  // Check if already running
  const backendHealthy = await checkHttp('http://localhost:5050/api/health');
  const frontendHealthy = await checkHttp('http://localhost:5174/');

  if (backendHealthy && frontendHealthy) {
    console.log('✅ Both Backend (5050) and Frontend (5174) are already running and healthy!');
    console.log('🚀 Opening browser at http://localhost:5174 ...');
    openBrowser('http://localhost:5174');
    return;
  }

  if (!backendHealthy) {
    console.log('[1/2] Starting SecureDoc Backend Server (Port 5050)...');
    freePort(5050);
    const serverProc = spawn('cmd.exe', ['/c', 'npm run dev'], {
      cwd: SERVER_DIR,
      stdio: 'inherit',
      detached: false,
    });
    serverProc.on('error', (err) => console.error('Backend process error:', err));
  } else {
    console.log('✅ Backend already healthy on port 5050.');
  }

  console.log('Waiting for backend health status...');
  const isBackendUp = await waitForHealth('http://localhost:5050/api/health');
  if (isBackendUp) {
    console.log('✅ Backend is healthy and ready!');
  } else {
    console.warn('⚠️ Backend took longer than expected, continuing with frontend startup...');
  }

  if (!frontendHealthy) {
    console.log('\n[2/2] Starting SecureDoc Frontend Dev Server (Port 5174)...');
    freePort(5174);
    const clientProc = spawn('cmd.exe', ['/c', 'npm run dev'], {
      cwd: CLIENT_DIR,
      stdio: 'inherit',
      detached: false,
    });
    clientProc.on('error', (err) => console.error('Frontend process error:', err));
  } else {
    console.log('✅ Frontend already healthy on port 5174.');
  }

  console.log('Waiting for frontend server ready...');
  const isFrontendUp = await waitForHealth('http://localhost:5174/');
  if (isFrontendUp) {
    console.log('✅ Frontend is live on http://localhost:5174');
    console.log('🚀 Launching SecureDoc in default browser...');
    openBrowser('http://localhost:5174');
  }

  console.log('\n======================================================');
  console.log('🎉 SecureDoc Advanced is fully online and accessible!');
  console.log('   Frontend : http://localhost:5174');
  console.log('   Backend  : http://localhost:5050/api/health');
  console.log('   Admin    : rbhrishikesh@gmail.com / Kesh@123');
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('Startup failed:', err);
});
