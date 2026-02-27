import type { Page } from 'playwright';
import { humanDelay } from './browser.js';
interface ActionStep {
    action: 'click' | 'type' | 'press' | 'navigate' | 'wait' | 'scroll' | 'select';
    selector?: string;
    text?: string;
    key?: string;
    url?: string;
    direction?: 'up' | 'down';
    ms?: number;
    description?: string;
}
interface LLMConfig {
    provider: 'openai' | 'anthropic' | 'openrouter' | 'ollama';
    apiKey?: string;
    model: string;
    baseUrl?: string;
}
declare function getActionsFromLLM(instruction: string, snapshot: string, pageUrl: string, llm: LLMConfig): Promise<ActionStep[]>;
declare function executeStep(page: Page, step: ActionStep): Promise<void>;
export declare function aiAct(page: Page, instruction: string, opts?: {
    verbose?: boolean;
}): Promise<{
    success: boolean;
    steps: ActionStep[];
    error?: string;
}>;
export { getActionsFromLLM, executeStep, humanDelay };
