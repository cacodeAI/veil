import chalk from 'chalk';
import { listSessions, deleteSession } from '../session.js';
export async function sessionListCommand() {
    const sessions = await listSessions();
    if (sessions.length === 0) {
        console.log(chalk.gray('No saved sessions. Run: veil login <platform>'));
        return;
    }
    console.log(chalk.cyan('\n🔐 Saved sessions:\n'));
    for (const s of sessions) {
        console.log(`  ${chalk.green('●')} ${chalk.bold(s)}`);
    }
    console.log('');
}
export async function logoutCommand(platform) {
    const deleted = await deleteSession(platform.toLowerCase());
    if (deleted) {
        console.log(chalk.green(`✅ Session for ${chalk.bold(platform)} removed.`));
    }
    else {
        console.log(chalk.yellow(`⚠️  No session found for ${chalk.bold(platform)}.`));
    }
}
