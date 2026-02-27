import { Browser, BrowserContext, Page } from 'playwright';
export declare function ensureBrowser(opts?: {
    headed?: boolean;
    platform?: string;
}): Promise<{
    browser: Browser;
    context: BrowserContext;
    page: Page;
}>;
export declare function getPage(): Promise<Page | null>;
export declare function closeBrowser(_platform?: string): Promise<void>;
export declare function humanDelay(min?: number, max?: number): Promise<void>;
