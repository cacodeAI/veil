import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { promises as fs } from 'fs';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { loadSession } from './session.js';

const VEIL_DIR = join(homedir(), '.veil');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

let _browser: Browser | null = null;
let _context: BrowserContext | null = null;
let _page: Page | null = null;

export async function ensureBrowser(opts: { headed?: boolean; platform?: string } = {}): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  if (_browser?.isConnected() && _page && !_page.isClosed()) {
    return { browser: _browser, context: _context!, page: _page };
  }

  const browser = await chromium.launch({
    headless: !opts.headed,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: UA,
    locale: 'en-US',
    timezoneId: 'America/New_York',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    (window as any).chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  });

  const session = await loadSession(opts.platform ?? 'default').catch(() => null);
  if (session?.cookies?.length) await context.addCookies(session.cookies).catch(() => {});

  const page = await context.newPage();
  _browser = browser;
  _context = context;
  _page = page;

  await fs.mkdir(VEIL_DIR, { recursive: true });
  process.once('exit', () => { browser.close().catch(() => {}); });

  return { browser, context, page };
}

export async function getPage(): Promise<Page | null> {
  return (_page && !_page.isClosed()) ? _page : null;
}

export async function closeBrowser(_platform?: string): Promise<void> {
  await _browser?.close().catch(() => {});
  _browser = null; _context = null; _page = null;
}

export function humanDelay(min = 400, max = 900): Promise<void> {
  return new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min) + min)));
}
