import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { promises as fs } from 'fs';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import { loadSession } from './session.js';

const VEIL_DIR = join(homedir(), '.veil');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// Detect system Chrome installation
function findSystemChrome(): string | null {
  const paths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  
  for (const path of paths) {
    try {
      execSync(`test -x "${path}"`, { stdio: 'ignore' });
      return path;
    } catch {}
  }
  return null;
}

let _browser: Browser | null = null;
let _context: BrowserContext | null = null;
let _page: Page | null = null;

export async function ensureBrowser(opts: { headed?: boolean; platform?: string } = {}): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  if (_browser?.isConnected() && _page && !_page.isClosed()) {
    return { browser: _browser, context: _context!, page: _page };
  }

  const executablePath = findSystemChrome();
  
  const browser = await chromium.launch({
    headless: !opts.headed,
    executablePath: executablePath || undefined, // Use system Chrome if found, else fallback
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,800',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-default-apps',
      '--disable-extensions',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: UA,
    locale: 'en-US',
    timezoneId: 'America/New_York',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
    ignoreHTTPSErrors: true,
  });

  await context.addInitScript(() => {
    // Spoof all automation detection vectors
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'chromeapp', { get: () => undefined });
    (window as any).chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    
    // Spoof permissions
    (window.navigator as any).permissions = {
      query: () => Promise.resolve({ state: Notification.permission })
    };
    
    // Override toString on navigator to hide automation
    const originalToString = Function.prototype.toString;
    Function.prototype.toString = function() {
      if (this === window.navigator.permissions.query) {
        return 'function query() { [native code] }';
      }
      return originalToString.call(this);
    };
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
