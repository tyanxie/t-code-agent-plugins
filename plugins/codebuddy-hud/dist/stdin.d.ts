import type { StdinData } from './types.js';
export declare function parseStdinData(raw: string): StdinData | null;
export declare function readStdin(): Promise<StdinData | null>;
export declare function getModelName(stdin: Partial<StdinData>): string;
export declare function getProjectPath(stdin: Partial<StdinData>, depth: number): string;
export interface CostInfo {
    totalCostUsd: number | null;
    totalDurationMs: number | null;
    totalApiDurationMs: number | null;
    totalLinesAdded: number | null;
    totalLinesRemoved: number | null;
}
export declare function getCost(stdin: Partial<StdinData>): CostInfo;
export interface ContextWindowInfo {
    totalInputTokens: number | null;
    totalOutputTokens: number | null;
    contextWindowSize: number | null;
    currentInputTokens: number | null;
    currentOutputTokens: number | null;
    cacheCreationTokens: number | null;
    cacheReadTokens: number | null;
    usedPercentage: number | null;
    remainingPercentage: number | null;
}
export declare function getContextWindow(stdin: Partial<StdinData>): ContextWindowInfo;
export declare function getVersion(stdin: Partial<StdinData>): string | null;
