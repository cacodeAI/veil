import chalk from 'chalk';
import ora from 'ora';
import { getBrowser, closeBrowser, humanDelay } from '../browser.js';
// ─── DuckDuckGo (default, no CAPTCHA) ────────────────────────────────────────
async function searchDuckDuckGo(query, headed) {
    const { page } = await getBrowser({ headed });
    try {
        await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=web`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });
        await humanDelay(1200, 2000);
        return await page.evaluate(() => {
            return [...document.querySelectorAll('article[data-testid="result"]')]
                .slice(0, 10)
                .map((el) => ({
                title: el.querySelector('h2')?.textContent?.trim() ?? '',
                url: el.querySelector('a[data-testid="result-extras-url-link"]')?.getAttribute('href') ??
                    el.querySelector('a[href^="http"]')?.getAttribute('href') ??
                    '',
                snippet: el.querySelector('[data-result="snippet"]')?.textContent?.trim() ??
                    el.querySelector('span[class]')?.textContent?.trim() ??
                    '',
                source: 'duckduckgo',
            }))
                .filter((r) => r.title && r.url);
        });
    }
    finally {
        await closeBrowser();
    }
}
// ─── Google (requires warmed session or CAPTCHA handling) ────────────────────
async function searchGoogle(query, headed) {
    const { page } = await getBrowser({ headed, platform: 'google' });
    try {
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });
        await humanDelay(1200, 2000);
        // Check for CAPTCHA
        const blocked = await page.evaluate(() => document.body.innerHTML.includes('unusual traffic') ||
            document.body.innerHTML.includes('recaptcha'));
        if (blocked) {
            // Fall back to DDG silently
            console.log(chalk.yellow('  ⚠️  Google blocked request, falling back to DuckDuckGo...'));
            await closeBrowser('google');
            return searchDuckDuckGo(query, headed);
        }
        const results = await page.evaluate(() => {
            const items = [];
            // Modern Google result selectors (2024-2026)
            const containers = document.querySelectorAll('div[data-hveid][data-ved] h3, div.g h3, div[jscontroller] h3');
            containers.forEach((h3) => {
                const parent = h3.closest('div[data-hveid], div.g, div[jscontroller]') ?? h3.parentElement;
                if (!parent)
                    return;
                const linkEl = parent.querySelector('a[href^="http"], a[href^="/url"]');
                let url = linkEl?.href ?? '';
                if (url.startsWith('/url?')) {
                    const u = new URL('https://google.com' + url);
                    url = u.searchParams.get('q') ?? url;
                }
                const snippetEl = parent.querySelector('[data-sncf], div.VwiC3b, span.aCOpRe, div[style*="-webkit-line-clamp"]');
                const title = h3.textContent?.trim() ?? '';
                if (title && url && url.startsWith('http')) {
                    items.push({ title, url, snippet: snippetEl?.textContent?.trim() ?? '', source: 'google' });
                }
            });
            return items.slice(0, 10);
        });
        await closeBrowser('google');
        return results;
    }
    catch (err) {
        await closeBrowser('google');
        throw err;
    }
}
// ─── Bing ───────────────────────────────────────────────────────────────────
async function searchBing(query, headed) {
    const { page } = await getBrowser({ headed });
    try {
        await page.goto(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });
        await humanDelay(1000, 1800);
        return await page.evaluate(() => [...document.querySelectorAll('li.b_algo')]
            .slice(0, 10)
            .map((el) => {
            const titleEl = el.querySelector('h2 a');
            return {
                title: titleEl?.textContent?.trim() ?? '',
                url: titleEl?.href ?? '',
                snippet: el.querySelector('.b_caption p')?.textContent?.trim() ?? '',
                source: 'bing',
            };
        })
            .filter((r) => r.title && r.url));
    }
    finally {
        await closeBrowser();
    }
}
// ─── Twitter/X ──────────────────────────────────────────────────────────────
async function searchTwitter(query, headed) {
    const { page } = await getBrowser({ headed, platform: 'x' });
    try {
        await page.goto(`https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await humanDelay(2000, 3000);
        return await page.evaluate(() => [...document.querySelectorAll('[data-testid="tweet"]')]
            .slice(0, 20)
            .map((el) => {
            const text = el.querySelector('[data-testid="tweetText"]')?.textContent?.trim() ?? '';
            const author = el.querySelector('[data-testid="User-Name"]')?.textContent?.trim() ?? '';
            const link = el.querySelector('a[href*="/status/"]')?.getAttribute('href') ?? '';
            return {
                title: author,
                url: `https://x.com${link}`,
                snippet: text,
                source: 'twitter',
            };
        })
            .filter((r) => r.snippet));
    }
    finally {
        await closeBrowser('x');
    }
}
// ─── Main command ────────────────────────────────────────────────────────────
export async function searchCommand(query, opts) {
    const limit = parseInt(opts.limit ?? '10');
    const rawEngines = opts.engine ?? 'duckduckgo';
    const engines = rawEngines.split(',').map((e) => e.trim().toLowerCase());
    const spinner = ora({
        text: `🔍 Searching "${query}" on ${engines.join(', ')}...`,
        color: 'cyan',
    }).start();
    try {
        const tasks = [];
        for (const engine of engines) {
            if (engine === 'google')
                tasks.push(searchGoogle(query, opts.headed ?? false));
            else if (engine === 'bing')
                tasks.push(searchBing(query, opts.headed ?? false));
            else if (engine === 'twitter' || engine === 'x')
                tasks.push(searchTwitter(query, opts.headed ?? false));
            else
                tasks.push(searchDuckDuckGo(query, opts.headed ?? false)); // default + 'duckduckgo'
        }
        const settled = await Promise.allSettled(tasks);
        const allResults = [];
        for (const r of settled) {
            if (r.status === 'fulfilled')
                allResults.push(...r.value);
            else
                spinner.warn(chalk.yellow(`One engine failed: ${r.reason?.message}`));
        }
        // Deduplicate by URL
        const seen = new Set();
        const deduped = allResults
            .filter((r) => {
            if (!r.url || seen.has(r.url))
                return false;
            seen.add(r.url);
            return true;
        })
            .slice(0, limit);
        spinner.succeed(chalk.green(`Found ${deduped.length} results`));
        if (opts.json) {
            console.log(JSON.stringify({ success: true, query, results: deduped }, null, 2));
        }
        else {
            console.log('');
            deduped.forEach((r, i) => {
                const badge = r.source === 'google' ? chalk.red('[G]')
                    : r.source === 'bing' ? chalk.blue('[B]')
                        : r.source === 'twitter' ? chalk.cyan('[X]')
                            : chalk.yellow('[D]');
                console.log(`${badge} ${chalk.bold(`${i + 1}. ${r.title}`)}`);
                console.log(`   ${chalk.blue(r.url)}`);
                if (r.snippet)
                    console.log(`   ${chalk.gray(r.snippet.slice(0, 140))}`);
                console.log('');
            });
        }
    }
    catch (err) {
        spinner.fail(chalk.red(`Search failed: ${err.message}`));
        if (opts.json)
            console.log(JSON.stringify({ success: false, error: err.message }));
        process.exit(1);
    }
}
