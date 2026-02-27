/**
 * Called once when veil starts any browser command.
 * Boots FlareSolverr in the background so it's ready before we hit a CAPTCHA.
 */
export declare function veilStartup(): Promise<void>;
