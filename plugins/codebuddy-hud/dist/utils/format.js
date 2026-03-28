export function formatDuration(ms) {
    if (ms == null)
        return '';
    const totalSec = Math.floor(ms / 1000);
    if (totalSec < 60)
        return `${totalSec}s`;
    const mins = Math.floor(totalSec / 60);
    if (mins < 60) {
        const secs = totalSec % 60;
        return `${mins}m${secs}s`;
    }
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours}h${remainMins}m`;
}
export function formatCost(usd) {
    if (usd == null)
        return '';
    if (usd > 0 && usd < 0.1)
        return `$${usd.toFixed(4)}`;
    return `$${usd.toFixed(2)}`;
}
export function formatDiff(added, removed) {
    if (added == null && removed == null)
        return '';
    return `+${added ?? 0}/-${removed ?? 0}`;
}
export function formatTokenCount(count) {
    if (count == null)
        return '';
    if (count >= 1_000_000)
        return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000)
        return `${(count / 1_000).toFixed(1)}K`;
    return `${count}`;
}
export function formatPercentage(pct) {
    if (pct == null)
        return '';
    return `${Math.round(pct)}%`;
}
//# sourceMappingURL=format.js.map