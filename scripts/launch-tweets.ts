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

async function postTweet(page: any, text: string, label: string) {
  await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector("[data-testid='primaryColumn']", { timeout: 20000 });
  await delay(1200, 1800);
  await page.locator("[data-testid='tweetTextarea_0']").first().click({ force: true });
  await delay(400, 600);
  await page.keyboard.type(text, { delay: 38 });
  await delay(700, 1000);
  await page.locator("[data-testid='tweetButtonInline']").first().click({ force: true });
  await delay(2500, 3200);
  console.log(`✅ Posted: ${label}`);
  // Return URL of posted tweet by checking profile
  const postedText = text.slice(0, 40);
  return postedText;
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
const context = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 800 }, locale: 'en-US' });
await context.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); });
await context.addCookies(cookies);
const page = await context.newPage();

// ── TWEET 1: The announcement ────────────────────────────────────────────────
await postTweet(page, `Shipping something new.

veil — a stealth browser remote for AI agents.

Post, like, reply, quote on X. Navigate any website. Every action returns clean JSON.

You're the brain. veil is the hands.

npm install -g veil-browser

→ github.com/cuttlelab/veil`, 'Announcement');

await delay(8000, 12000); // natural gap between posts

// ── TWEET 2: The demo ────────────────────────────────────────────────────────
await postTweet(page, `What it looks like:

$ veil login x
$ veil post "hello world"
$ veil like --nth 0
$ veil reply "great point" --nth 0
$ veil quote "worth reading" --nth 2

That's it. Real browser. Stealth. JSON output. No LLM inside — your agent decides every step.`, 'Demo');

await delay(8000, 12000);

// ── TWEET 3: The why ─────────────────────────────────────────────────────────
await postTweet(page, `Why veil?

Most browser automation is built for developers writing scripts.

veil is built for AI agents making decisions in real-time — where every step is a tool call and the agent decides what happens next.

Open source. MIT. Built at CUTTLELAB.

→ cuttlelab.github.io/veil`, 'Why');

console.log('\n🎉 All 3 launch tweets posted!');
await browser.close();
