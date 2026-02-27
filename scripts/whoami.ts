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

// Check who we're logged in as
await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
await new Promise(r => setTimeout(r, 4000));

const accountName = await page.locator('[data-testid="SideNav_AccountSwitcher_Button"]').first().textContent().catch(() => 'not found');
const url = page.url();
console.log('URL:', url);
console.log('Account switcher text:', accountName?.slice(0, 100));

// Get the logged-in username from the aria label
const aria = await page.locator('[data-testid="SideNav_AccountSwitcher_Button"]').first().getAttribute('aria-label').catch(() => '');
console.log('aria-label:', aria);

// Try to find the profile link
const profileHref = await page.locator('[data-testid="AppTabBar_Profile_Link"]').getAttribute('href').catch(() => '');
console.log('Profile href:', profileHref);

await browser.close();
