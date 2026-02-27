import { Page } from 'playwright';
export interface DaemonConfig {
    instruction: string;
    interval: number;
    platform: 'x' | 'linkedin' | 'reddit' | 'bluesky';
    maxRuns?: number;
    stopOn?: string[];
}
/**
 * Run veil in daemon mode — continuously execute actions at intervals
 */
export declare function daemonCommand(config: DaemonConfig, executeAction: (page: Page, instruction: string) => Promise<void>): Promise<void>;
/**
 * Parse daemon CLI args
 */
export declare function parseDaemonArgs(args: Record<string, any>): DaemonConfig | null;
