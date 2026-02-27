import chalk from 'chalk';
import ora from 'ora';
import { getBrowser, closeBrowser, humanDelay } from '../browser.js';
export async function extractCommand(query, opts) {
    const spinner = ora({ text: `Extracting: ${query}`, color: 'cyan' }).start();
    const { page } = await getBrowser({ headed: opts.headed, platform: opts.platform });
    try {
        if (opts.url) {
            await page.goto(opts.url, { waitUntil: 'domcontentloaded' });
            await humanDelay(800, 1500);
        }
        const lower = query.toLowerCase();
        let result;
        // Twitter/X feed
        if (lower.includes('tweet') || lower.includes('feed') || lower.includes('timeline')) {
            const tweets = await page.locator('[data-testid="tweet"]').all();
            const data = await Promise.all(tweets.slice(0, 20).map(async (t) => {
                const text = await t.locator('[data-testid="tweetText"]').textContent().catch(() => '');
                const author = await t.locator('[data-testid="User-Name"]').textContent().catch(() => '');
                return { author: author?.trim(), text: text?.trim() };
            }));
            result = data.filter((d) => d.text);
        }
        // Links
        else if (lower.includes('link') || lower.includes('url')) {
            const links = await page.locator('a[href]').all();
            result = await Promise.all(links.slice(0, 50).map(async (l) => ({
                text: (await l.textContent())?.trim(),
                href: await l.getAttribute('href'),
            })));
        }
        // Page text
        else if (lower.includes('text') || lower.includes('content')) {
            result = await page.evaluate(() => document.body.innerText.slice(0, 5000));
        }
        // Title
        else if (lower.includes('title')) {
            result = await page.title();
        }
        // Default: page metadata
        else {
            result = {
                title: await page.title(),
                url: page.url(),
                text: await page.evaluate(() => document.body.innerText.slice(0, 2000)),
            };
        }
        spinner.succeed(chalk.green('✅ Extracted'));
        if (opts.json) {
            console.log(JSON.stringify({ success: true, query, result }, null, 2));
        }
        else {
            console.log(chalk.cyan('\nResult:'));
            console.log(JSON.stringify(result, null, 2));
        }
    }
    catch (err) {
        spinner.fail(chalk.red(`❌ Extract failed: ${err.message}`));
        process.exit(1);
    }
    finally {
        await closeBrowser(opts.platform);
    }
}
