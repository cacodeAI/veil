import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const sessionPath = join(homedir(), '.veil', 'sessions', 'x.json');
const data = JSON.parse(readFileSync(sessionPath, 'utf-8'));
const cookies = data.cookies ?? [];

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
});
await context.addCookies(cookies);
const page = await context.newPage();

await page.goto('https://x.com/teodorwalterv', { waitUntil: 'domcontentloaded', timeout: 30000 });
await new Promise(r => setTimeout(r, 5000));

const tweets = await page.locator('[data-testid="tweetText"]').allTextContents().catch(() => []);
console.log(`Found ${tweets.length} tweets`);
tweets.slice(0, 3).forEach((t, i) => console.log(`\n[${i+1}] ${t.slice(0, 250)}`));

await browser.close();
