import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
const FLARESOLVERR_PORT = 8191;
const FLARESOLVERR_IMAGE = 'ghcr.io/flaresolverr/flaresolverr:latest';
const FLARESOLVERR_CONTAINER = 'veil-flaresolverr';
// ─── Docker / FlareSolverr lifecycle ────────────────────────────────────────
function isDockerAvailable() {
    try {
        execSync('docker info --format json', { stdio: 'pipe' });
        return true;
    }
    catch {
        return false;
    }
}
function isFlareSolverrRunning() {
    try {
        const out = execSync(`docker ps --filter "name=${FLARESOLVERR_CONTAINER}" --filter "status=running" --format "{{.Names}}"`, { stdio: 'pipe' }).toString().trim();
        return out.includes(FLARESOLVERR_CONTAINER);
    }
    catch {
        return false;
    }
}
async function pingFlareSolverr() {
    try {
        const res = await fetch(`http://localhost:${FLARESOLVERR_PORT}/v1`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cmd: 'sessions.list' }),
            signal: AbortSignal.timeout(3000),
        });
        return res.ok;
    }
    catch {
        return false;
    }
}
export async function isFlareSolverrUp() {
    return pingFlareSolverr();
}
export async function ensureFlareSolverr() {
    if (!isDockerAvailable()) {
        console.log(chalk.yellow('⚠️  Docker not available — Cloudflare CAPTCHA bypass disabled'));
        return false;
    }
    // Already up?
    if (await pingFlareSolverr())
        return true;
    const spinner = ora({ text: '🐳 Starting FlareSolverr...', color: 'cyan' }).start();
    try {
        // Pull image if needed (silently)
        if (!isFlareSolverrRunning()) {
            try {
                execSync(`docker inspect ${FLARESOLVERR_IMAGE}`, { stdio: 'pipe' });
            }
            catch {
                spinner.text = '🐳 Pulling FlareSolverr image (first time only)...';
                execSync(`docker pull ${FLARESOLVERR_IMAGE}`, { stdio: 'pipe' });
            }
            // Remove old stopped container if exists
            try {
                execSync(`docker rm -f ${FLARESOLVERR_CONTAINER}`, { stdio: 'pipe' });
            }
            catch { }
            // Start container
            execSync(`docker run -d --name ${FLARESOLVERR_CONTAINER} ` +
                `-p ${FLARESOLVERR_PORT}:8191 ` +
                `-e LOG_LEVEL=error ` +
                `--restart unless-stopped ` +
                `${FLARESOLVERR_IMAGE}`, { stdio: 'pipe' });
        }
        // Wait for it to be ready (up to 15s)
        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 1000));
            if (await pingFlareSolverr()) {
                spinner.succeed(chalk.green('✅ FlareSolverr ready'));
                return true;
            }
        }
        spinner.fail(chalk.red('FlareSolverr failed to start in time'));
        return false;
    }
    catch (err) {
        spinner.fail(chalk.red(`FlareSolverr error: ${err.message}`));
        return false;
    }
}
export async function stopFlareSolverr() {
    try {
        execSync(`docker stop ${FLARESOLVERR_CONTAINER}`, { stdio: 'pipe' });
        console.log(chalk.gray('FlareSolverr stopped.'));
    }
    catch { }
}
// ─── Ollama vision solver (reCAPTCHA image grids) ───────────────────────────
async function isOllamaAvailable() {
    try {
        const res = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) });
        return res.ok;
    }
    catch {
        return false;
    }
}
async function getOllamaVisionModel() {
    try {
        const res = await fetch('http://localhost:11434/api/tags');
        const data = await res.json();
        const models = (data.models ?? []).map((m) => m.name);
        // Prefer these vision models in order
        const preferred = ['llava', 'moondream', 'llava-phi3', 'bakllava', 'minicpm-v'];
        for (const p of preferred) {
            const found = models.find(m => m.toLowerCase().includes(p));
            if (found)
                return found;
        }
        return null;
    }
    catch {
        return null;
    }
}
async function solveImageCaptchaWithOllama(imageBase64, prompt, model) {
    const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            prompt,
            images: [imageBase64],
            stream: false,
        }),
    });
    const data = await res.json();
    return data.response?.trim() ?? '';
}
// ─── Tesseract OCR (text CAPTCHAs) ──────────────────────────────────────────
async function solveTextCaptchaWithTesseract(imageBuffer) {
    try {
        // Dynamic import so it doesn't fail if not installed
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng');
        const { data: { text } } = await worker.recognize(imageBuffer);
        await worker.terminate();
        return text.replace(/\s+/g, '').trim();
    }
    catch {
        throw new Error('tesseract.js not available — run: npm install -g tesseract.js');
    }
}
// ─── FlareSolverr request proxy ─────────────────────────────────────────────
export async function solveWithFlareSolverr(url) {
    const available = await ensureFlareSolverr();
    if (!available)
        return null;
    const spinner = ora({ text: '🛡️  Solving Cloudflare challenge...', color: 'cyan' }).start();
    try {
        const res = await fetch(`http://localhost:${FLARESOLVERR_PORT}/v1`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cmd: 'request.get',
                url,
                maxTimeout: 60000,
            }),
            signal: AbortSignal.timeout(70000),
        });
        const data = await res.json();
        if (data.status !== 'ok') {
            spinner.fail(chalk.red(`FlareSolverr failed: ${data.message}`));
            return null;
        }
        spinner.succeed(chalk.green('✅ Cloudflare challenge solved!'));
        return {
            cookies: data.solution?.cookies ?? [],
            userAgent: data.solution?.userAgent ?? '',
            response: data.solution?.response ?? '',
        };
    }
    catch (err) {
        spinner.fail(chalk.red(`FlareSolverr error: ${err.message}`));
        return null;
    }
}
export async function detectCaptcha(page) {
    return await page.evaluate(() => {
        const html = document.body?.innerHTML ?? '';
        const bodyText = document.body?.innerText ?? '';
        if (html.includes('challenges.cloudflare.com') || html.includes('cf-turnstile'))
            return 'turnstile';
        if (bodyText.includes('unusual traffic') || html.includes('recaptcha/enterprise'))
            return 'cloudflare';
        if (html.includes('recaptcha') && html.includes('rc-imageselect'))
            return 'recaptcha-image';
        if (html.includes('recaptcha'))
            return 'recaptcha-v3';
        if (html.includes('hcaptcha'))
            return 'hcaptcha';
        if (document.querySelector('img[alt*="captcha" i]'))
            return 'text';
        return null;
    });
}
export async function handleCaptchaLocally(page) {
    const type = await detectCaptcha(page);
    if (!type)
        return false;
    console.log(chalk.yellow(`\n⚠️  CAPTCHA detected: ${chalk.bold(type)}`));
    // Cloudflare Turnstile → FlareSolverr
    if (type === 'turnstile' || type === 'cloudflare') {
        const result = await solveWithFlareSolverr(page.url());
        if (result) {
            // Inject the solved cookies into the browser context
            const context = page.context();
            for (const cookie of result.cookies) {
                await context.addCookies([{
                        name: cookie.name,
                        value: cookie.value,
                        domain: cookie.domain,
                        path: cookie.path ?? '/',
                        expires: -1,
                        httpOnly: false,
                        secure: false,
                        sameSite: 'Lax',
                    }]).catch(() => { });
            }
            await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => { });
            return true;
        }
    }
    // reCAPTCHA image grid → Ollama vision
    if (type === 'recaptcha-image') {
        const ollamaOk = await isOllamaAvailable();
        const model = ollamaOk ? await getOllamaVisionModel() : null;
        if (model) {
            const spinner = ora({ text: `🤖 Solving image CAPTCHA with Ollama (${model})...`, color: 'cyan' }).start();
            try {
                // Screenshot just the CAPTCHA iframe area
                const captchaEl = page.locator('iframe[src*="recaptcha"]').first();
                const box = await captchaEl.boundingBox();
                if (box) {
                    const screenshotBuf = await page.screenshot({
                        clip: { x: box.x, y: box.y, width: box.width, height: box.height }
                    });
                    const b64 = screenshotBuf.toString('base64');
                    const answer = await solveImageCaptchaWithOllama(b64, 'This is a CAPTCHA image grid. Identify which tiles match the category shown. Reply with the tile positions (1-9, numbered left-to-right, top-to-bottom) that match. Be concise.', model);
                    spinner.succeed(chalk.green(`Ollama says: ${answer}`));
                    // Note: full injection requires more complex interaction, this is a best-effort
                }
            }
            catch (err) {
                spinner.fail(chalk.yellow(`Ollama solve failed: ${err.message}`));
            }
        }
        else {
            console.log(chalk.gray('  💡 Tip: Install a vision model with Ollama for auto-solve: ollama pull llava'));
        }
    }
    // Text CAPTCHA → Tesseract
    if (type === 'text') {
        try {
            const imgEl = page.locator('img[alt*="captcha" i]').first();
            const imgSrc = await imgEl.getAttribute('src').catch(() => null);
            if (imgSrc) {
                const spinner = ora({ text: '🔤 Reading text CAPTCHA with Tesseract...', color: 'cyan' }).start();
                const res = await fetch(imgSrc);
                const buf = Buffer.from(await res.arrayBuffer());
                const text = await solveTextCaptchaWithTesseract(buf);
                spinner.succeed(chalk.green(`Tesseract read: "${text}"`));
                // Fill into input
                const input = page.locator('input[name*="captcha" i]').first();
                await input.fill(text).catch(() => { });
                await page.keyboard.press('Enter').catch(() => { });
                return true;
            }
        }
        catch { }
    }
    // Final fallback: human notification
    console.log(chalk.cyan('\n🧑 Could not auto-solve. Please solve the CAPTCHA in a browser window.'));
    console.log(chalk.gray('   Run: veil navigate ' + page.url() + ' --headed\n'));
    return false;
}
