import type { Page } from 'playwright';
export interface VeilConfig {
    captcha?: {
        provider?: '2captcha' | 'capmonster' | 'anticaptcha';
        apiKey?: string;
    };
    proxy?: {
        server?: string;
        username?: string;
        password?: string;
    };
}
export type VeilErrorCode = 'SELECTOR_NOT_FOUND' | 'NAVIGATION_TIMEOUT' | 'SESSION_EXPIRED' | 'CAPTCHA_DETECTED' | 'RATE_LIMITED' | 'UNKNOWN';
export declare class VeilError extends Error {
    code: VeilErrorCode;
    screenshotPath?: string;
    suggestion?: string;
    constructor(code: VeilErrorCode, message: string, suggestion?: string);
}
export declare function detectCaptcha(page: Page): Promise<'turnstile' | 'recaptcha' | 'hcaptcha' | 'image' | null>;
export declare function handleCaptcha(page: Page, screenshotDir?: string): Promise<boolean>;
export declare function withRetry<T>(fn: () => Promise<T>, opts?: {
    attempts?: number;
    delay?: number;
    label?: string;
}): Promise<T>;
export declare function screenshotOnError(page: Page, label: string): Promise<string | null>;
