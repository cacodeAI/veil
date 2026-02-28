/**
 * Veil Platform Directory
 * Comprehensive mapping of platforms with login URLs, selectors, and metadata
 */
export const PLATFORMS = {
    // ─── AI & Image Generation ───
    gemini: {
        name: 'Google Gemini',
        loginUrl: 'https://gemini.google.com/',
        aliases: ['gemini', 'google-gemini', 'bard'],
        category: 'ai',
        postLoginCheck: '[aria-label*="Send a message"]',
        cookies: ['__Secure-GSID', '__Secure-HSID'],
        notes: 'Google account required',
    },
    'dalle-web': {
        name: 'DALL-E (OpenAI Web)',
        loginUrl: 'https://openai.com/api/auth/callback/auth0',
        aliases: ['dalle', 'dalle-3', 'dall-e', 'openai-images'],
        category: 'ai',
        postLoginCheck: 'button[aria-label*="Generate"]',
        cookies: ['_U'],
        notes: 'OpenAI account required',
    },
    'claude-web': {
        name: 'Claude (Anthropic Web)',
        loginUrl: 'https://claude.ai/',
        aliases: ['claude', 'anthropic', 'claude-web'],
        category: 'ai',
        postLoginCheck: 'textarea[placeholder*="Send a message"]',
        cookies: ['__Secure-SSID'],
        notes: 'Anthropic/Claude subscription required',
    },
    midjourney: {
        name: 'Midjourney',
        loginUrl: 'https://www.midjourney.com/auth/login',
        aliases: ['midjourney', 'mj'],
        category: 'ai',
        selectors: {
            emailInput: 'input[type="email"]',
            passwordInput: 'input[type="password"]',
            submitButton: 'button[type="submit"]',
        },
        postLoginCheck: 'div[data-testid="sidebar"]',
        notes: 'Discord-based, requires account',
    },
    'stability-ai': {
        name: 'Stability AI (DreamStudio)',
        loginUrl: 'https://dreamstudio.ai/generate',
        aliases: ['stability', 'dreamstudio', 'stable-diffusion-web'],
        category: 'ai',
        postLoginCheck: 'button:has-text("Generate")',
        notes: 'API key or account required',
    },
    // ─── Social Media ───
    x: {
        name: 'X (Twitter)',
        loginUrl: 'https://x.com/login',
        aliases: ['x', 'twitter', 'x-com'],
        category: 'social',
        selectors: {
            emailInput: 'input[autocomplete="username"]',
            passwordInput: 'input[type="password"]',
            submitButton: 'button[type="submit"]',
        },
        postLoginCheck: 'a[href="/home"]',
        cookies: ['auth_token'],
    },
    bluesky: {
        name: 'Bluesky',
        loginUrl: 'https://bsky.app/login',
        aliases: ['bluesky', 'bsky'],
        category: 'social',
        selectors: {
            usernameInput: 'input[placeholder*="Username"]',
            passwordInput: 'input[type="password"]',
            submitButton: 'button:has-text("Sign in")',
        },
        postLoginCheck: 'div[aria-label="Home timeline"]',
    },
    reddit: {
        name: 'Reddit',
        loginUrl: 'https://www.reddit.com/login',
        aliases: ['reddit'],
        category: 'social',
        selectors: {
            emailInput: 'input[id*="login-username"]',
            passwordInput: 'input[id*="login-password"]',
            submitButton: 'button[type="submit"]',
        },
        postLoginCheck: 'button[aria-label*="Create post"]',
        cookies: ['session_tracker'],
    },
    linkedin: {
        name: 'LinkedIn',
        loginUrl: 'https://www.linkedin.com/login',
        aliases: ['linkedin'],
        category: 'social',
        selectors: {
            emailInput: 'input#username',
            passwordInput: 'input#password',
            submitButton: 'button[type="submit"]',
        },
        postLoginCheck: 'a[data-control-name="feed_home_button"]',
        cookies: ['li_at'],
    },
    github: {
        name: 'GitHub',
        loginUrl: 'https://github.com/login',
        aliases: ['github', 'gh'],
        category: 'dev',
        selectors: {
            emailInput: 'input#login_field',
            passwordInput: 'input#password',
            submitButton: 'input[type="submit"]',
        },
        postLoginCheck: 'div[data-nav-core-github-home-feed]',
        cookies: ['user_session', 'logged_in'],
    },
    // ─── Email & Productivity ───
    gmail: {
        name: 'Gmail',
        loginUrl: 'https://accounts.google.com/ServiceLogin?service=mail',
        aliases: ['gmail', 'google-mail'],
        category: 'email',
        postLoginCheck: 'div[role="button"]:has-text("Compose")',
        cookies: ['__Secure-GSID'],
        notes: 'Google account',
    },
    notion: {
        name: 'Notion',
        loginUrl: 'https://www.notion.so/login',
        aliases: ['notion'],
        category: 'productivity',
        selectors: {
            emailInput: 'input[type="email"]',
            submitButton: 'button:has-text("Continue with email")',
        },
        postLoginCheck: 'div[data-testid="sidebar"]',
    },
    notion_sso: {
        name: 'Notion (Google SSO)',
        loginUrl: 'https://www.notion.so/login?google=true',
        aliases: ['notion-google', 'notion-sso'],
        category: 'productivity',
        postLoginCheck: 'div[data-testid="sidebar"]',
    },
    // ─── Development & APIs ───
    openai_platform: {
        name: 'OpenAI Platform',
        loginUrl: 'https://platform.openai.com/login',
        aliases: ['openai', 'openai-api', 'openai-platform'],
        category: 'dev',
        selectors: {
            emailInput: 'input[type="email"]',
            submitButton: 'button:has-text("Continue")',
        },
        postLoginCheck: 'button[aria-label="Create new secret key"]',
        cookies: ['_auth0sso'],
    },
    anthropic_console: {
        name: 'Anthropic Console',
        loginUrl: 'https://console.anthropic.com/login',
        aliases: ['anthropic', 'anthropic-api', 'anthropic-console'],
        category: 'dev',
        postLoginCheck: 'button:has-text("Create API key")',
    },
    huggingface: {
        name: 'Hugging Face',
        loginUrl: 'https://huggingface.co/login',
        aliases: ['huggingface', 'hf'],
        category: 'dev',
        selectors: {
            usernameInput: 'input[name="username"]',
            passwordInput: 'input[name="password"]',
            submitButton: 'button[type="submit"]',
        },
        postLoginCheck: 'a[href*="/settings"]',
    },
    // ─── Shopping ───
    amazon: {
        name: 'Amazon',
        loginUrl: 'https://www.amazon.com/ap/signin',
        aliases: ['amazon'],
        category: 'shopping',
        selectors: {
            emailInput: 'input#ap_email',
            passwordInput: 'input#ap_password',
            submitButton: 'input#signInSubmit',
        },
        postLoginCheck: 'a[data-nav-ref="nav_your_account"]',
    },
    ebay: {
        name: 'eBay',
        loginUrl: 'https://signin.ebay.com/signin/',
        aliases: ['ebay'],
        category: 'shopping',
        selectors: {
            emailInput: 'input#userid',
            passwordInput: 'input#pass',
            submitButton: 'button#signin-continue',
        },
        postLoginCheck: 'a[href*="myaccount"]',
    },
    // ─── Finance ───
    stripe: {
        name: 'Stripe Dashboard',
        loginUrl: 'https://dashboard.stripe.com/login',
        aliases: ['stripe'],
        category: 'finance',
        selectors: {
            emailInput: 'input[type="email"]',
            passwordInput: 'input[type="password"]',
            submitButton: 'button[type="submit"]',
        },
        postLoginCheck: 'button[aria-label*="Account menu"]',
    },
    // ─── Miscellaneous ───
    google: {
        name: 'Google (Generic)',
        loginUrl: 'https://accounts.google.com/',
        aliases: ['google', 'google-account'],
        category: 'other',
        selectors: {
            emailInput: 'input#identifierId',
            submitButton: 'button#identifierNext',
        },
    },
    microsoft: {
        name: 'Microsoft Account',
        loginUrl: 'https://login.live.com/',
        aliases: ['microsoft', 'outlook', 'hotmail'],
        category: 'other',
        selectors: {
            emailInput: 'input[type="email"]',
            submitButton: 'input[type="submit"]',
        },
    },
    apple: {
        name: 'Apple ID',
        loginUrl: 'https://appleid.apple.com/',
        aliases: ['apple', 'apple-id'],
        category: 'other',
        selectors: {
            emailInput: 'input#user-name',
            passwordInput: 'input#password',
            submitButton: 'button[type="submit"]',
        },
    },
};
export function getPlatform(query) {
    const lower = query.toLowerCase();
    // Exact match in key
    if (PLATFORMS[lower]) {
        return PLATFORMS[lower];
    }
    // Check aliases
    for (const [, platform] of Object.entries(PLATFORMS)) {
        if (platform.aliases.includes(lower)) {
            return platform;
        }
    }
    // Fuzzy match on name
    for (const [, platform] of Object.entries(PLATFORMS)) {
        if (platform.name.toLowerCase().includes(lower)) {
            return platform;
        }
    }
    return null;
}
export function listPlatforms(category) {
    if (!category) {
        return Object.values(PLATFORMS);
    }
    return Object.values(PLATFORMS).filter(p => p.category === category);
}
export function searchPlatforms(query) {
    const lower = query.toLowerCase();
    return Object.values(PLATFORMS).filter(p => p.name.toLowerCase().includes(lower) ||
        p.aliases.some(a => a.includes(lower)));
}
