import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const TWEET = `The quietest days are often the most important ones.

No new features today. Just making what exists more reliable, more consistent, more honest.

That's the work that actually compounds.`;

const STEALTH_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function humanDelay(min = 400, max = 900) {
  return new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min) + min)));
}

(async () => {
  // Load saved cookies
  const sessionPath = join(homedir(), '.veil', 'sessions', 'x.json');
  let cookies = [];
  try {
    const data = JSON.parse(readFileSync(sessionPath, 'utf-8'));
    cookies = data.cookies ?? [];
    console.log(`Loaded ${cookies.length} cookies for X`);
  } catch {
    console.log('No saved session found — you may need to login first');
  }

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,800',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: STEALTH_UA,
    locale: 'en-US',
    timezoneId: 'America/New_York',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    (window as any).chrome = { runtime: {} };
  });

  if (cookies.length) await context.addCookies(cookies);

  const page = await context.newPage();

  console.log('Navigating to X...');
  await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector("[data-testid='primaryColumn']", { timeout: 20000 });
  console.log('✓ Feed loaded');

  await humanDelay(1000, 1600);

  await page.locator("[data-testid='tweetTextarea_0']").first().click({ force: true });
  await humanDelay(400, 700);

  await page.keyboard.type(TWEET, { delay: 38 });
  await humanDelay(700, 1100);

  await page.screenshot({ path: '/tmp/veil-before-post.png' });
  console.log('✓ Screenshot before: /tmp/veil-before-post.png');

  await page.locator("[data-testid='tweetButtonInline']").first().click({ force: true });
  await humanDelay(2500, 3000);

  await page.screenshot({ path: '/tmp/veil-after-post.png' });
  console.log('✓ Screenshot after: /tmp/veil-after-post.png');
  console.log('✓ Post submitted. URL:', page.url());

  await browser.close();
})().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
