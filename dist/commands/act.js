import chalk from 'chalk';
import ora from 'ora';
import { getBrowser, closeBrowser, humanDelay } from '../browser.js';
import { aiAct } from '../ai.js';
// Fallback: simple heuristic actions (no LLM needed)
async function performFallbackAction(page, instruction) {
    const lower = instruction.toLowerCase();
    const clickMatch = lower.match(/^click\s+(?:on\s+)?["']?(.+?)["']?\s*$/);
    if (clickMatch) {
        const target = clickMatch[1];
        await page.getByRole('button', { name: new RegExp(target, 'i') }).first().click().catch(async () => {
            await page.getByText(new RegExp(target, 'i')).first().click();
        });
        await humanDelay();
        return `Clicked: ${target}`;
    }
    const typeMatch = lower.match(/^type\s+["'](.+?)["']\s+(?:in|into)\s+["']?(.+?)["']?\s*$/);
    if (typeMatch) {
        const [, text, field] = typeMatch;
        await page.getByRole('textbox', { name: new RegExp(field, 'i') }).fill(text);
        await humanDelay();
        return `Typed "${text}" into ${field}`;
    }
    const tweetMatch = instruction.match(/^post\s+(?:tweet|on twitter|on x)[:\s]+["']?(.+?)["']?\s*$/i);
    if (tweetMatch) {
        const tweetText = tweetMatch[1];
        await page.goto('https://x.com/compose/post', { waitUntil: 'domcontentloaded' });
        await humanDelay(1000, 2000);
        const editor = page.locator('[data-testid="tweetTextarea_0"]');
        await editor.click();
        await humanDelay(300, 600);
        await editor.fill(tweetText);
        await humanDelay(500, 1000);
        await page.locator('[data-testid="tweetButtonInline"]').click();
        await humanDelay(1000, 2000);
        return `Posted tweet: "${tweetText}"`;
    }
    if (lower.includes('like') && (lower.includes('tweet') || lower.includes('post'))) {
        await page.locator('[data-testid="like"]').first().click();
        await humanDelay();
        return 'Liked the post';
    }
    if (lower.includes('scroll down')) {
        await page.evaluate(() => window.scrollBy(0, 600));
        await humanDelay();
        return 'Scrolled down';
    }
    if (lower.includes('scroll up')) {
        await page.evaluate(() => window.scrollBy(0, -600));
        await humanDelay();
        return 'Scrolled up';
    }
    if (lower.includes('press enter') || lower.includes('submit')) {
        await page.keyboard.press('Enter');
        await humanDelay();
        return 'Pressed Enter';
    }
    const gotoMatch = instruction.match(/^(?:go to|navigate to|open)\s+(https?:\/\/\S+)/i);
    if (gotoMatch) {
        await page.goto(gotoMatch[1], { waitUntil: 'domcontentloaded' });
        await humanDelay(800, 1500);
        return `Navigated to ${gotoMatch[1]}`;
    }
    throw new Error(`Could not parse instruction without AI: "${instruction}". Set an LLM API key for smart act.`);
}
export async function actCommand(instruction, opts) {
    const { page } = await getBrowser({ headed: opts.headed, platform: opts.platform });
    try {
        if (opts.url) {
            const spinner = ora({ text: `Loading ${opts.url}...`, color: 'cyan' }).start();
            await page.goto(opts.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await humanDelay(800, 1500);
            spinner.succeed(chalk.gray(`Loaded ${opts.url}`));
        }
        // Try AI-powered act first
        try {
            const result = await aiAct(page, instruction, { verbose: opts.verbose });
            if (opts.json) {
                console.log(JSON.stringify({ success: result.success, action: instruction, steps: result.steps }));
            }
            if (!result.success)
                process.exit(1);
        }
        catch (aiErr) {
            // If AI not configured, fall back to heuristics
            if (aiErr.message.includes('No LLM configured')) {
                console.log(chalk.yellow('⚠️  No LLM configured, using fallback heuristics...'));
                const result = await performFallbackAction(page, instruction);
                console.log(chalk.green(`✅ ${result}`));
                if (opts.json)
                    console.log(JSON.stringify({ success: true, action: instruction, result }));
            }
            else {
                throw aiErr;
            }
        }
    }
    catch (err) {
        console.error(chalk.red(`❌ Action failed: ${err.message}`));
        if (opts.json)
            console.log(JSON.stringify({ success: false, action: instruction, error: err.message }));
        process.exit(1);
    }
    finally {
        await closeBrowser(opts.platform);
    }
}
