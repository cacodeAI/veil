export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    source: string;
}
export declare function searchCommand(query: string, opts: {
    engine?: string;
    platform?: string;
    headed?: boolean;
    json?: boolean;
    limit?: string;
}): Promise<void>;
