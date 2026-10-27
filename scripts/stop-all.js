const { execSync } = require('child_process');

function freePort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const lines = output.trim().split('\n');
    let killed = false;
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const proto = parts[0];
      const localAddr = parts[1] || '';
      const pid = parts[parts.length - 1];
      if (proto.startsWith('TCP') && localAddr.endsWith(`:${port}`) && pid && pid !== '0') {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`✅ Stopped process on port ${port} (PID ${pid})`);
          killed = true;
        } catch {}
      }
    }
    if (!killed) {
      console.log(`ℹ️ Port ${port} is already free.`);
    }
  } catch {
    console.log(`ℹ️ Port ${port} is already free.`);
  }
}

console.log('\nStopping SecureDoc Advanced services...');
freePort(5050);
freePort(5174);
console.log('Done.\n');
