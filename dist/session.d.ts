export declare function saveSession(platform: string, state: object): Promise<void>;
export declare function loadSession(platform: string): Promise<any | null>;
export declare function deleteSession(platform: string): Promise<boolean>;
export declare function listSessions(): Promise<string[]>;
