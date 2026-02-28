/**
 * Veil Platform Directory
 * Comprehensive mapping of platforms with login URLs, selectors, and metadata
 */
export interface PlatformConfig {
    name: string;
    loginUrl: string;
    aliases: string[];
    category: 'social' | 'ai' | 'productivity' | 'email' | 'shopping' | 'dev' | 'finance' | 'other';
    selectors?: {
        emailInput?: string;
        usernameInput?: string;
        passwordInput?: string;
        submitButton?: string;
        nextButton?: string;
        verificationInput?: string;
    };
    postLoginCheck?: string;
    cookies?: string[];
    notes?: string;
}
export declare const PLATFORMS: Record<string, PlatformConfig>;
export declare function getPlatform(query: string): PlatformConfig | null;
export declare function listPlatforms(category?: PlatformConfig['category']): PlatformConfig[];
export declare function searchPlatforms(query: string): PlatformConfig[];
