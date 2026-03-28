import type { RenderContext } from '../types.js';
export declare function renderContextBar(ctx: RenderContext, options?: {
    showLabel?: boolean;
}): string | null;
export declare function renderStatsLine(ctx: RenderContext, options?: {
    includeContext?: boolean;
}): string | null;
