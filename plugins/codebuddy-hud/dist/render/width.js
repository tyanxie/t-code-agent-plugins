import { RESET } from './colors.js';
// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE_PATTERN = /^\x1b\[[0-9;]*m/;
const ANSI_ESCAPE_GLOBAL = /\x1b\[[0-9;]*m/g;
const GRAPHEME_SEGMENTER = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;
export function stripAnsi(str) {
    return str.replace(ANSI_ESCAPE_GLOBAL, '');
}
function splitAnsiTokens(str) {
    const tokens = [];
    let i = 0;
    while (i < str.length) {
        const ansiMatch = ANSI_ESCAPE_PATTERN.exec(str.slice(i));
        if (ansiMatch) {
            tokens.push({ type: 'ansi', value: ansiMatch[0] });
            i += ansiMatch[0].length;
            continue;
        }
        let j = i;
        while (j < str.length) {
            const nextAnsi = ANSI_ESCAPE_PATTERN.exec(str.slice(j));
            if (nextAnsi)
                break;
            j += 1;
        }
        tokens.push({ type: 'text', value: str.slice(i, j) });
        i = j;
    }
    return tokens;
}
function segmentGraphemes(text) {
    if (!text)
        return [];
    if (!GRAPHEME_SEGMENTER)
        return Array.from(text);
    return Array.from(GRAPHEME_SEGMENTER.segment(text), (segment) => segment.segment);
}
function isWideCodePoint(codePoint) {
    return (codePoint >= 0x1100 &&
        (codePoint <= 0x115f ||
            codePoint === 0x2329 ||
            codePoint === 0x232a ||
            (codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f) ||
            (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
            (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
            (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
            (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
            (codePoint >= 0xff00 && codePoint <= 0xff60) ||
            (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
            (codePoint >= 0x1f300 && codePoint <= 0x1faff) ||
            (codePoint >= 0x20000 && codePoint <= 0x3fffd)));
}
function graphemeWidth(grapheme) {
    if (!grapheme || /^\p{Control}$/u.test(grapheme))
        return 0;
    // Emoji and ZWJ sequences typically render as double-width
    if (/\p{Extended_Pictographic}/u.test(grapheme))
        return 2;
    let hasVisibleBase = false;
    let width = 0;
    for (const char of Array.from(grapheme)) {
        if (/^\p{Mark}$/u.test(char) || char === '\u200D' || char === '\uFE0F') {
            continue;
        }
        hasVisibleBase = true;
        const codePoint = char.codePointAt(0);
        if (codePoint !== undefined && isWideCodePoint(codePoint)) {
            width = Math.max(width, 2);
        }
        else {
            width = Math.max(width, 1);
        }
    }
    return hasVisibleBase ? width : 0;
}
export function visualLength(str) {
    let width = 0;
    for (const token of splitAnsiTokens(str)) {
        if (token.type === 'ansi')
            continue;
        for (const grapheme of segmentGraphemes(token.value)) {
            width += graphemeWidth(grapheme);
        }
    }
    return width;
}
function sliceVisible(str, maxVisible) {
    if (maxVisible <= 0)
        return '';
    let result = '';
    let visibleWidth = 0;
    let done = false;
    let i = 0;
    while (i < str.length && !done) {
        const ansiMatch = ANSI_ESCAPE_PATTERN.exec(str.slice(i));
        if (ansiMatch) {
            result += ansiMatch[0];
            i += ansiMatch[0].length;
            continue;
        }
        let j = i;
        while (j < str.length) {
            const nextAnsi = ANSI_ESCAPE_PATTERN.exec(str.slice(j));
            if (nextAnsi)
                break;
            j += 1;
        }
        const plainChunk = str.slice(i, j);
        for (const grapheme of segmentGraphemes(plainChunk)) {
            const w = graphemeWidth(grapheme);
            if (visibleWidth + w > maxVisible) {
                done = true;
                break;
            }
            result += grapheme;
            visibleWidth += w;
        }
        i = j;
    }
    return result;
}
export function truncateToWidth(str, maxWidth) {
    if (maxWidth <= 0 || visualLength(str) <= maxWidth)
        return str;
    const suffix = maxWidth >= 3 ? '...' : '.'.repeat(maxWidth);
    const keep = Math.max(0, maxWidth - suffix.length);
    return `${sliceVisible(str, keep)}${suffix}${RESET}`;
}
// ── line wrapping by separator ──────────────────────────────────────
function splitLineBySeparators(line) {
    const segments = [];
    const separators = [];
    let currentStart = 0;
    let i = 0;
    while (i < line.length) {
        const ansiMatch = ANSI_ESCAPE_PATTERN.exec(line.slice(i));
        if (ansiMatch) {
            i += ansiMatch[0].length;
            continue;
        }
        const separator = line.startsWith(' | ', i)
            ? ' | '
            : line.startsWith(' \u2502 ', i)
                ? ' \u2502 '
                : null;
        if (separator) {
            segments.push(line.slice(currentStart, i));
            separators.push(separator);
            i += separator.length;
            currentStart = i;
            continue;
        }
        i += 1;
    }
    segments.push(line.slice(currentStart));
    return { segments, separators };
}
function splitWrapParts(line) {
    const { segments, separators } = splitLineBySeparators(line);
    if (segments.length === 0)
        return [];
    let parts = [
        { separator: '', segment: segments[0] },
    ];
    for (let idx = 1; idx < segments.length; idx += 1) {
        parts.push({
            separator: separators[idx - 1] ?? ' | ',
            segment: segments[idx],
        });
    }
    // Keep leading [model | provider] block together
    const firstVisible = stripAnsi(parts[0].segment).trimStart();
    const firstHasOpen = firstVisible.startsWith('[');
    const firstHasClose = stripAnsi(parts[0].segment).includes(']');
    if (firstHasOpen && !firstHasClose && parts.length > 1) {
        let merged = parts[0].segment;
        let consumeIndex = 1;
        while (consumeIndex < parts.length) {
            const next = parts[consumeIndex];
            merged += `${next.separator}${next.segment}`;
            consumeIndex += 1;
            if (stripAnsi(next.segment).includes(']'))
                break;
        }
        parts = [
            { separator: '', segment: merged },
            ...parts.slice(consumeIndex),
        ];
    }
    return parts;
}
export function wrapLineToWidth(line, maxWidth) {
    if (maxWidth <= 0 || visualLength(line) <= maxWidth)
        return [line];
    const parts = splitWrapParts(line);
    if (parts.length <= 1)
        return [truncateToWidth(line, maxWidth)];
    const wrapped = [];
    let current = parts[0].segment;
    for (const part of parts.slice(1)) {
        const candidate = `${current}${part.separator}${part.segment}`;
        if (visualLength(candidate) <= maxWidth) {
            current = candidate;
            continue;
        }
        wrapped.push(truncateToWidth(current, maxWidth));
        current = part.segment;
    }
    if (current) {
        wrapped.push(truncateToWidth(current, maxWidth));
    }
    return wrapped;
}
export function getTerminalWidth() {
    const stdoutColumns = process.stdout?.columns;
    if (typeof stdoutColumns === 'number' &&
        Number.isFinite(stdoutColumns) &&
        stdoutColumns > 0) {
        return Math.floor(stdoutColumns);
    }
    const stderrColumns = process.stderr?.columns;
    if (typeof stderrColumns === 'number' &&
        Number.isFinite(stderrColumns) &&
        stderrColumns > 0) {
        return Math.floor(stderrColumns);
    }
    const envColumns = Number.parseInt(process.env.COLUMNS ?? '', 10);
    if (Number.isFinite(envColumns) && envColumns > 0) {
        return envColumns;
    }
    return null;
}
//# sourceMappingURL=width.js.map