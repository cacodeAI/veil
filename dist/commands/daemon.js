import chalk from 'chalk';
import ora from 'ora';
/**
 * Run veil in daemon mode — continuously execute actions at intervals
 */
export async function daemonCommand(config, executeAction) {
    const { instruction, interval, platform, maxRuns = Infinity, stopOn = [] } = config;
    let runCount = 0;
    let errors = 0;
    const startTime = new Date();
    console.log(chalk.cyan(`\n🤖 veil daemon started`));
    console.log(chalk.gray(`   Instruction: ${instruction}`));
    console.log(chalk.gray(`   Interval: ${interval}m`));
    console.log(chalk.gray(`   Platform: ${platform}`));
    console.log(chalk.gray(`   Max runs: ${maxRuns === Infinity ? '∞' : maxRuns}`));
    console.log(chalk.gray(`   Ctrl+C to stop\n`));
    const intervalMs = interval * 60 * 1000;
    // Graceful shutdown handler
    const shutdown = (sig) => {
        console.log(chalk.yellow(`\n⏹️  ${sig} received, shutting down gracefully...`));
        console.log(chalk.green(`\n✅ Daemon stopped`));
        console.log(chalk.gray(`   Runs: ${runCount}`));
        console.log(chalk.gray(`   Errors: ${errors}`));
        console.log(chalk.gray(`   Duration: ${Math.round((Date.now() - startTime.getTime()) / 1000)}s`));
        process.exit(0);
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    // Run loop
    const runLoop = async () => {
        while (runCount < maxRuns) {
            const spinner = ora({
                text: `Run ${runCount + 1}/${maxRuns === Infinity ? '∞' : maxRuns}`,
                color: 'cyan',
            }).start();
            try {
                // Import browser here to keep session fresh
                const { chromium } = await import('playwright');
                const browser = await chromium.launch({
                    headless: true,
                    args: ['--disable-blink-features=AutomationControlled'],
                });
                const context = await browser.newContext();
                const page = await context.newPage();
                // Navigate to platform home first
                const platformUrls = {
                    x: 'https://x.com/home',
                    twitter: 'https://twitter.com/home',
                    linkedin: 'https://www.linkedin.com/feed',
                    reddit: 'https://www.reddit.com',
                    bluesky: 'https://bsky.app',
                };
                const startUrl = platformUrls[platform];
                if (startUrl) {
                    await page.goto(startUrl, { waitUntil: 'domcontentloaded' }).catch(() => { });
                    // Wait for page to settle
                    await new Promise(r => setTimeout(r, 2000));
                }
                try {
                    await executeAction(page, instruction);
                    runCount++;
                    spinner.succeed(chalk.green(`✅ Run ${runCount} succeeded`));
                    errors = 0; // Reset error counter on success
                }
                catch (err) {
                    errors++;
                    const errMsg = err.message ?? String(err);
                    if (stopOn.some(pattern => errMsg.includes(pattern))) {
                        spinner.fail(chalk.red(`Run ${runCount + 1} failed: ${errMsg}`));
                        console.log(chalk.red(`\n⛔ Stop condition triggered: ${errMsg}`));
                        process.exit(1);
                    }
                    if (errors > 3) {
                        spinner.fail(chalk.red(`Run ${runCount + 1} failed (3rd error in a row)`));
                        console.log(chalk.red(`\n⛔ Too many consecutive errors, stopping.`));
                        process.exit(1);
                    }
                    spinner.warn(chalk.yellow(`Run ${runCount + 1} failed: ${errMsg}`));
                    spinner.text = `Retrying in ${interval}m...`;
                }
                finally {
                    await page.close().catch(() => { });
                    await context.close().catch(() => { });
                    await browser.close().catch(() => { });
                }
            }
            catch (fatalErr) {
                spinner.fail(chalk.red(`Fatal error: ${fatalErr.message}`));
                console.log(chalk.red(`\n⛔ Daemon stopped due to fatal error`));
                process.exit(1);
            }
            // Wait before next run
            if (runCount < maxRuns) {
                spinner.start(`Next run in ${interval}m...`);
                await new Promise(resolve => setTimeout(resolve, intervalMs));
                spinner.stop();
            }
        }
        // Reached max runs
        console.log(chalk.green(`\n✅ Completed ${maxRuns} runs`));
        process.exit(0);
    };
    await runLoop();
}
/**
 * Parse daemon CLI args
 */
export function parseDaemonArgs(args) {
    if (!args.daemon)
        return null;
    const instruction = args._?.[0];
    if (!instruction) {
        console.error(chalk.red('Error: instruction required'));
        console.error(chalk.gray('Usage: veil daemon <instruction> --interval 5 --platform x [--max-runs 10]'));
        process.exit(1);
    }
    return {
        instruction,
        interval: parseInt(args.interval ?? '5', 10),
        platform: args.platform ?? 'x',
        maxRuns: args.maxRuns ? parseInt(args.maxRuns, 10) : Infinity,
        stopOn: args.stopOn ? (Array.isArray(args.stopOn) ? args.stopOn : [args.stopOn]) : [],
    };
}
