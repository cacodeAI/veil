import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
const SESSION_DIR = join(homedir(), '.veil', 'sessions');
async function ensureDir() {
    await fs.mkdir(SESSION_DIR, { recursive: true });
}
export async function saveSession(platform, state) {
    await ensureDir();
    const file = join(SESSION_DIR, `${platform}.json`);
    await fs.writeFile(file, JSON.stringify(state, null, 2), 'utf-8');
}
export async function loadSession(platform) {
    const file = join(SESSION_DIR, `${platform}.json`);
    try {
        const raw = await fs.readFile(file, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export async function deleteSession(platform) {
    const file = join(SESSION_DIR, `${platform}.json`);
    try {
        await fs.unlink(file);
        return true;
    }
    catch {
        return false;
    }
}
export async function listSessions() {
    await ensureDir();
    const files = await fs.readdir(SESSION_DIR);
    return files.filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
}
