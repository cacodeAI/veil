import chalk from 'chalk';
import ora from 'ora';
import { getBrowser, closeBrowser, humanDelay } from '../browser.js';
export async function navigateCommand(url, opts) {
    const spinner = ora({ text: `Navigating to ${url}...`, color: 'cyan' }).start();
    const { page } = await getBrowser({ headed: opts.headed, platform: opts.platform });
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await humanDelay(500, 1200);
        const title = await page.title();
        const finalUrl = page.url();
        spinner.succeed(chalk.green(`Navigated to: ${chalk.bold(title)}`));
        if (opts.json) {
            console.log(JSON.stringify({ success: true, url: finalUrl, title }));
        }
        else {
            console.log(chalk.gray(`  URL: ${finalUrl}`));
        }
    }
    finally {
        await closeBrowser(opts.platform);
    }
}
