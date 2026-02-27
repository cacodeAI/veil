import chalk from 'chalk';
import ora from 'ora';
import { getBrowser, closeBrowser } from '../browser.js';
import { loadSession } from '../session.js';
const PLATFORM_LOGIN_URLS = {
    twitter: 'https://x.com/login',
    x: 'https://x.com/login',
    reddit: 'https://www.reddit.com/login',
    linkedin: 'https://www.linkedin.com/login',
    github: 'https://github.com/login',
    instagram: 'https://www.instagram.com/accounts/login',
};
const PLATFORM_SUCCESS_PATTERNS = {
    twitter: ['x.com/home', 'twitter.com/home'],
    x: ['x.com/home', 'twitter.com/home'],
    reddit: ['reddit.com/?'],
    linkedin: ['linkedin.com/feed'],
    github: ['github.com', '!/login', '!/session'],
    instagram: ['instagram.com', '!/accounts/login'],
};
function isLoggedIn(url, platform) {
    const patterns = PLATFORM_SUCCESS_PATTERNS[platform.toLowerCase()] ?? [];
    return patterns.some((p) => {
        if (p.startsWith('!'))
            return !url.includes(p.slice(1));
        return url.includes(p);
    });
}
export async function loginCommand(platform) {
    const p = platform.toLowerCase();
    const loginUrl = PLATFORM_LOGIN_URLS[p] ?? `https://${p}.com/login`;
    const existing = await loadSession(p);
    if (existing) {
        console.log(chalk.yellow(`⚠️  Session for ${chalk.bold(platform)} already exists. Use ${chalk.bold('veil logout ' + platform)} to clear it first.`));
        return;
    }
    console.log(chalk.cyan(`\n🔐 Opening browser for ${chalk.bold(platform)} login...`));
    console.log(chalk.gray('   Complete the login in the browser window. Veil will detect when you\'re done.\n'));
    const { browser, context, page } = await getBrowser({ headed: true, platform: p });
    await page.goto(loginUrl);
    const spinner = ora({ text: 'Waiting for login...', color: 'cyan' }).start();
    await new Promise((resolve) => {
        const check = async () => {
            try {
                const url = page.url();
                if (isLoggedIn(url, p)) {
                    clearInterval(interval);
                    resolve();
                }
            }
            catch { }
        };
        const interval = setInterval(check, 1000);
        // Also handle manual close
        browser.on('disconnected', () => {
            clearInterval(interval);
            resolve();
        });
    });
    spinner.succeed(chalk.green(`✅ Logged in to ${chalk.bold(platform)}! Saving session...`));
    await closeBrowser(p);
    console.log(chalk.green(`\n🎉 Session saved! You can now use ${chalk.bold('veil')} with ${chalk.bold(platform)} in headless mode.\n`));
}
