import { getIcon } from './icons.js';
import { colorize, dim } from './colors.js';
import { getCost, getContextWindow } from '../stdin.js';
import { formatCost, formatDuration, formatDiff, formatTokenCount, formatPercentage } from '../utils/format.js';
export function renderContextBar(ctx, options) {
    const { config, stdin } = ctx;
    const { display, colors } = config;
    const showLabel = options?.showLabel ?? false;
    if (!display.contextUsage)
        return null;
    const cw = getContextWindow(stdin);
    const pct = cw.usedPercentage ?? 0;
    const barLength = 10;
    const filled = Math.round((pct / 100) * barLength);
    const empty = barLength - filled;
    const filledChar = '\u2588';
    const emptyChar = '\u2591';
    const bar = filledChar.repeat(filled) + emptyChar.repeat(empty);
    const pctStr = formatPercentage(pct);
    let color;
    if (pct >= colors.contextCritical) {
        color = 'red';
    }
    else if (pct >= colors.contextWarning) {
        color = 'yellow';
    }
    else {
        color = 'cyan';
    }
    let result = showLabel
        ? colorize(`Context ${bar} ${pctStr}`, color)
        : colorize(`${bar} ${pctStr}`, color);
    if (display.contextValues && cw.currentInputTokens != null && cw.contextWindowSize != null) {
        const current = formatTokenCount(cw.currentInputTokens);
        const total = formatTokenCount(cw.contextWindowSize);
        result += ` ${dim(`(${current}/${total})`)}`;
    }
    return result;
}
export function renderStatsLine(ctx, options) {
    const { config, stdin } = ctx;
    const { display, colors } = config;
    const cost = getCost(stdin);
    const includeContext = options?.includeContext ?? true;
    const segments = [];
    if (includeContext) {
        const contextBar = renderContextBar(ctx, { showLabel: true });
        if (contextBar)
            segments.push(contextBar);
    }
    if (display.cost && cost.totalCostUsd != null && cost.totalCostUsd > 0) {
        const icon = getIcon('cost');
        const formatted = formatCost(cost.totalCostUsd);
        let color;
        if (cost.totalCostUsd >= colors.costCritical) {
            color = 'red';
        }
        else if (cost.totalCostUsd >= colors.costWarning) {
            color = 'yellow';
        }
        else {
            color = 'cyan';
        }
        segments.push(colorize(`${icon} ${formatted}`, color));
    }
    if (display.duration && cost.totalDurationMs != null) {
        const icon = getIcon('duration');
        const formatted = formatDuration(cost.totalDurationMs);
        if (formatted) {
            segments.push(`${icon} ${formatted}`);
        }
    }
    if (display.diff && (cost.totalLinesAdded != null || cost.totalLinesRemoved != null)) {
        const icon = getIcon('diff');
        const formatted = formatDiff(cost.totalLinesAdded, cost.totalLinesRemoved);
        if (formatted) {
            segments.push(`${icon} ${formatted}`);
        }
    }
    if (segments.length === 0)
        return null;
    return segments.join(' | ');
}
//# sourceMappingURL=stats.js.map