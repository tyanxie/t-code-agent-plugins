export function parseStdinData(raw) {
    if (!raw || !raw.trim())
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export async function readStdin() {
    return new Promise((resolve) => {
        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (chunk) => { data += chunk; });
        process.stdin.on('end', () => { resolve(parseStdinData(data)); });
        // 如果 stdin 没有数据（如直接运行），1 秒后超时
        setTimeout(() => { resolve(parseStdinData(data)); }, 1000);
    });
}
export function getModelName(stdin) {
    return stdin.model?.display_name ?? stdin.model?.id ?? 'unknown';
}
export function getProjectPath(stdin, depth) {
    const dir = stdin.workspace?.current_dir ?? stdin.cwd ?? '';
    if (!dir)
        return '';
    const segments = dir.split('/').filter(Boolean);
    const sliced = segments.slice(-Math.min(depth, segments.length));
    return sliced.join('/');
}
export function getCost(stdin) {
    const cost = stdin.cost;
    return {
        totalCostUsd: cost?.total_cost_usd ?? null,
        totalDurationMs: cost?.total_duration_ms ?? null,
        totalApiDurationMs: cost?.total_api_duration_ms ?? null,
        totalLinesAdded: cost?.total_lines_added ?? null,
        totalLinesRemoved: cost?.total_lines_removed ?? null,
    };
}
export function getContextWindow(stdin) {
    const cw = stdin.context_window;
    return {
        totalInputTokens: cw?.total_input_tokens ?? null,
        totalOutputTokens: cw?.total_output_tokens ?? null,
        contextWindowSize: cw?.context_window_size ?? null,
        currentInputTokens: cw?.current_usage?.input_tokens ?? null,
        currentOutputTokens: cw?.current_usage?.output_tokens ?? null,
        cacheCreationTokens: cw?.current_usage?.cache_creation_input_tokens ?? null,
        cacheReadTokens: cw?.current_usage?.cache_read_input_tokens ?? null,
        usedPercentage: cw?.used_percentage ?? null,
        remainingPercentage: cw?.remaining_percentage ?? null,
    };
}
export function getVersion(stdin) {
    return stdin.version ?? null;
}
export function getSessionId(stdin, length = 8) {
    const id = stdin.session_id ?? null;
    if (!id)
        return null;
    return id.slice(0, length);
}
//# sourceMappingURL=stdin.js.map