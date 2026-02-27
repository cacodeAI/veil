import type { Page } from 'playwright';
export declare function isFlareSolverrUp(): Promise<boolean>;
export declare function ensureFlareSolverr(): Promise<boolean>;
export declare function stopFlareSolverr(): Promise<void>;
export declare function solveWithFlareSolverr(url: string): Promise<{
    cookies: Array<{
        name: string;
        value: string;
        domain: string;
        path: string;
    }>;
    userAgent: string;
    response: string;
} | null>;
export type CaptchaType = 'turnstile' | 'recaptcha-image' | 'recaptcha-v3' | 'hcaptcha' | 'text' | 'cloudflare' | null;
export declare function detectCaptcha(page: Page): Promise<CaptchaType>;
export declare function handleCaptchaLocally(page: Page): Promise<boolean>;
