const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(__dirname, '..', 'screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching Chrome from:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Helper for waiting
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  console.log('1. Capturing Landing Page...');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0', timeout: 15000 });
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig1_landing_hero.png') });

  console.log('2. Capturing Login Page...');
  // Navigate to login or click login
  await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig2_auth_portal.png') });

  console.log('3. Logging in as Admin...');
  try {
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    if (emailInput && passwordInput) {
      await emailInput.click({ clickCount: 3 });
      await emailInput.type('rbhrishikesh@gmail.com');
      await passwordInput.click({ clickCount: 3 });
      await passwordInput.type('Kesh@123');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await sleep(3000);
      }
    }
  } catch (err) {
    console.warn('Login attempt note:', err.message);
  }

  console.log('4. Capturing Dashboard & Document Vault...');
  await page.goto('http://localhost:5174/dashboard', { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await sleep(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig3_dashboard_vault.png') });

  console.log('5. Capturing Document Explorer with Filter/Search...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig4_document_explorer.png') });

  console.log('6. Capturing Admin Forensic Audit Dashboard...');
  await page.goto('http://localhost:5174/admin', { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await sleep(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig5_admin_audit.png') });

  console.log('7. Capturing Dynamic Dark/Light Theme...');
  await page.goto('http://localhost:5174/dashboard', { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await sleep(1000);
  // Toggle theme button if available
  const themeBtn = await page.$('button[title*="theme"], button[aria-label*="theme"], .theme-toggle');
  if (themeBtn) {
    await themeBtn.click();
    await sleep(800);
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig6_dark_mode_theme.png') });

  console.log('8. Capturing Shared Documents...');
  await page.goto('http://localhost:5174/shared', { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig7_shared_docs.png') });

  console.log('9. Capturing Profile & Security Settings...');
  await page.goto('http://localhost:5174/profile', { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig8_profile_security.png') });

  await browser.close();
  console.log('All screenshots captured successfully in:', OUTPUT_DIR);
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
