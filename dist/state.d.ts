export interface VeilState {
    sessionId: string;
    currentUrl: string;
    platform?: string;
    pageTitle?: string;
    lastAction: string;
    timestamp: number;
    history: string[];
    error?: string;
}
export declare function saveState(sessionId: string, state: Partial<VeilState>): Promise<void>;
export declare function loadState(sessionId: string): Promise<VeilState | null>;
export declare function clearState(sessionId: string): Promise<void>;
