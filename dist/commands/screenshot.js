import chalk from 'chalk';
import ora from 'ora';
import { getBrowser, closeBrowser, humanDelay } from '../browser.js';
import { join } from 'path';
export async function screenshotCommand(opts) {
    const outPath = opts.output ?? join(process.cwd(), `screenshot-${Date.now()}.png`);
    const spinner = ora({ text: 'Taking screenshot...', color: 'cyan' }).start();
    const { page } = await getBrowser({ headed: opts.headed, platform: opts.platform });
    try {
        if (opts.url) {
            await page.goto(opts.url, { waitUntil: 'domcontentloaded' });
            await humanDelay(800, 1500);
        }
        await page.screenshot({ path: outPath, fullPage: false });
        spinner.succeed(chalk.green(`📸 Screenshot saved: ${chalk.bold(outPath)}`));
        if (opts.json) {
            console.log(JSON.stringify({ success: true, path: outPath }));
        }
    }
    catch (err) {
        spinner.fail(chalk.red(`❌ Screenshot failed: ${err.message}`));
        process.exit(1);
    }
    finally {
        await closeBrowser(opts.platform);
    }
}
