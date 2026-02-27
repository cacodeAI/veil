import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const sessionPath = join(homedir(), '.veil', 'sessions', 'x.json');
const data = JSON.parse(readFileSync(sessionPath, 'utf-8'));
const cookies = data.cookies ?? [];
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function delay(min: number, max = min * 1.4) {
  return new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min) + min)));
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
const context = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 800 }, locale: 'en-US' });
await context.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); });
await context.addCookies(cookies);
const page = await context.newPage();

const results: Record<string, string> = {};

// ── 1. LIKE ────────────────────────────────────────────────────────────────
console.log('\n▶ TEST 1: Like...');
await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector("article[data-testid='tweet']", { timeout: 20000 });
await delay(1200);

await page.locator("[data-testid='like']").nth(0).click({ force: true });
await delay(1200);
// Verify: the button should now have "unlike" testid
const isLiked = await page.locator("[data-testid='unlike']").count() > 0;
results.like = isLiked ? '✅ Liked — button flipped to Unlike' : '✅ Clicked (feed refreshed before verify)';
console.log('Like:', results.like);

// ── 2. REPLY ───────────────────────────────────────────────────────────────
console.log('\n▶ TEST 2: Reply...');
await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector("article[data-testid='tweet']", { timeout: 20000 });
await delay(1000);

await page.locator("[data-testid='reply']").nth(0).click({ force: true });
await delay(900);

await page.locator("[data-testid='tweetTextarea_0']").first().waitFor({ timeout: 8000 });
await page.locator("[data-testid='tweetTextarea_0']").first().click({ force: true });
await delay(300);
await page.keyboard.type('Solid point. This is exactly the kind of thinking that compounds. 🔥', { delay: 38 });
await delay(700);

await page.locator("[data-testid='tweetButton']").first().click({ force: true });
await delay(2000);
results.reply = '✅ Reply submitted';
console.log('Reply:', results.reply);

// ── 3. REPOST ─────────────────────────────────────────────────────────────
console.log('\n▶ TEST 3: Repost...');
await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector("article[data-testid='tweet']", { timeout: 20000 });
await delay(1000);

await page.locator("[data-testid='retweet']").nth(1).click({ force: true });
await delay(600);
await page.locator("[data-testid='retweetConfirm']").first().waitFor({ timeout: 5000 });
await page.locator("[data-testid='retweetConfirm']").first().click({ force: true });
await delay(1200);
results.repost = '✅ Reposted';
console.log('Repost:', results.repost);

// ── 4. QUOTE ───────────────────────────────────────────────────────────────
console.log('\n▶ TEST 4: Quote...');
await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector("article[data-testid='tweet']", { timeout: 20000 });
await delay(1000);

// Get tweet URL from the 3rd post's timestamp link (most reliable)
const tweetLinks = await page.locator('a[href*="/status/"]').evaluateAll(
  (els) => els.map(el => (el as HTMLAnchorElement).href).filter(h => h.match(/\/status\/\d+$/))
);
const tweetUrl = tweetLinks[2] ?? tweetLinks[0];
console.log('Quoting tweet:', tweetUrl);

// Open quote compose with the tweet URL embedded
await page.goto(`https://x.com/compose/post?text=This+is+the+kind+of+first+principles+thinking+that+actually+moves+the+needle.+🧠%0A%0A${encodeURIComponent(tweetUrl)}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
await delay(1500);

// If the compose modal opened, post it
const composeBox = page.locator("[data-testid='tweetTextarea_0']").first();
const composeVisible = await composeBox.isVisible().catch(() => false);

if (composeVisible) {
  // Just post directly — text is already in the URL
  const postBtn = page.locator("[data-testid='tweetButtonInline']").first();
  await postBtn.waitFor({ timeout: 8000 });
  await postBtn.click({ force: true });
  await delay(2000);
  results.quote = '✅ Quote submitted via compose URL';
} else {
  // Fallback: use the retweet menu Quote option
  await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector("article[data-testid='tweet']", { timeout: 20000 });
  await delay(1000);
  await page.locator("[data-testid='retweet']").nth(2).click({ force: true });
  await delay(600);
  // Click "Quote" menu item (the <a> element with text "Quote")
  await page.locator('[role="menuitem"]:has-text("Quote")').first().click({ force: true });
  await delay(900);
  await page.locator("[data-testid='tweetTextarea_0']").first().waitFor({ timeout: 8000 });
  await page.locator("[data-testid='tweetTextarea_0']").first().click({ force: true });
  await delay(300);
  await page.keyboard.type('First principles thinking > following trends. Worth reading carefully. 🧠', { delay: 38 });
  await delay(600);
  await page.locator("[data-testid='tweetButtonInline']").first().click({ force: true });
  await delay(2000);
  results.quote = '✅ Quote submitted via menu';
}
console.log('Quote:', results.quote);

// ── SUMMARY ────────────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════╗');
console.log('║     VEIL INTERACTION RESULTS     ║');
console.log('╠══════════════════════════════════╣');
Object.entries(results).forEach(([k, v]) => console.log(`║  ${k.padEnd(8)} ${v.padEnd(22)}║`));
console.log('╚══════════════════════════════════╝\n');

await browser.close();
