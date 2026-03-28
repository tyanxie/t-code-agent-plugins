import type { HudConfig } from './types.js';
export declare const DEFAULT_CONFIG: HudConfig;
export declare function mergeConfig(override: Record<string, unknown>): HudConfig;
export declare function validateConfig(config: HudConfig): boolean;
export declare function loadConfig(): HudConfig;
