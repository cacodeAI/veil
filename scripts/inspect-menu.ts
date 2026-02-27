import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const sessionPath = join(homedir(), '.veil', 'sessions', 'x.json');
const data = JSON.parse(readFileSync(sessionPath, 'utf-8'));
const cookies = data.cookies ?? [];
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 800 } });
await context.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); });
await context.addCookies(cookies);
const page = await context.newPage();

await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector("article[data-testid='tweet']", { timeout: 20000 });
await delay(1500);

// Open the retweet/repost menu on post 3
const shareBtn = page.locator("[data-testid='retweet']").nth(2);
await shareBtn.click({ force: true });
await delay(700);

// Snapshot the menu
await page.screenshot({ path: '/tmp/veil-menu.png' });
const menuHTML = await page.evaluate(() => {
  const menu = document.querySelector('[role="menu"]');
  return menu ? menu.outerHTML.slice(0, 2000) : 'no menu found';
});
console.log('Menu HTML:', menuHTML);

// List all menu items
const items = await page.locator('[role="menuitem"]').allTextContents();
console.log('Menu items:', JSON.stringify(items));

// Also check data-testid values
const testids = await page.locator('[role="menuitem"]').evaluateAll(
  (els) => els.map(el => el.getAttribute('data-testid'))
);
console.log('data-testids:', JSON.stringify(testids));

await browser.close();
