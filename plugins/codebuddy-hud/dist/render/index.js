import { renderIdentityLine } from './identity.js';
import { renderStatsLine, renderContextBar } from './stats.js';
import { renderActivityLine } from './activity.js';
import { getTerminalWidth, wrapLineToWidth } from './width.js';
import { getModelName, getProjectPath } from '../stdin.js';
import { colorize } from './colors.js';
const RESET = '\x1b[0m';
function renderExpanded(ctx) {
    const lines = [];
    const identity = renderIdentityLine(ctx);
    if (identity)
        lines.push(identity);
    const stats = renderStatsLine(ctx);
    if (stats)
        lines.push(stats);
    const activity = renderActivityLine(ctx);
    if (activity)
        lines.push(activity);
    return lines;
}
function renderCompact(ctx) {
    const { config, stdin, gitStatus } = ctx;
    const { display, colors } = config;
    const parts = [];
    // Model part
    if (display.model) {
        const name = getModelName(stdin);
        parts.push(colorize(`[${name}]`, colors.model));
    }
    // Context bar (between model and project in compact mode)
    const contextBar = renderContextBar(ctx);
    if (contextBar)
        parts.push(contextBar);
    // Project + git part
    if (display.project) {
        const project = getProjectPath(stdin, display.projectDepth);
        let segment = colorize(project, colors.project);
        if (display.git && gitStatus) {
            const dirty = gitStatus.isDirty && config.git.dirty ? '*' : '';
            segment += ' ' + colorize(`(${gitStatus.branch}${dirty})`, colors.git);
        }
        parts.push(segment);
    }
    // Version
    if (display.version) {
        const ver = stdin.version;
        if (ver)
            parts.push(`v${ver}`);
    }
    // Stats (without context, since it's already shown above)
    const stats = renderStatsLine(ctx, { includeContext: false });
    if (stats)
        parts.push(stats);
    if (parts.length === 0)
        return [];
    return [parts.join(' | ')];
}
export function render(ctx) {
    const layout = ctx.config.layout;
    const lines = layout === 'expanded'
        ? renderExpanded(ctx)
        : renderCompact(ctx);
    const terminalWidth = getTerminalWidth();
    const outputLines = terminalWidth
        ? lines.flatMap(line => wrapLineToWidth(line, terminalWidth))
        : lines;
    for (const line of outputLines) {
        console.log(`${RESET}${line}`);
    }
}
//# sourceMappingURL=index.js.map