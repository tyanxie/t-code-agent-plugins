// src/stdin.ts
import type { StdinData } from './types.js';

export function parseStdinData(raw: string): StdinData | null {
  if (!raw || !raw.trim()) return null;
  try {
    return JSON.parse(raw) as StdinData;
  } catch {
    return null;
  }
}

export async function readStdin(): Promise<StdinData | null> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => { resolve(parseStdinData(data)); });
    // 如果 stdin 没有数据（如直接运行），1 秒后超时
    setTimeout(() => { resolve(parseStdinData(data)); }, 1000);
  });
}

export function getModelName(stdin: Partial<StdinData>): string {
  return stdin.model?.display_name ?? stdin.model?.id ?? 'unknown';
}

export function getProjectPath(stdin: Partial<StdinData>, depth: number): string {
  const dir = stdin.workspace?.current_dir ?? stdin.cwd ?? '';
  if (!dir) return '';
  const segments = dir.split('/').filter(Boolean);
  const sliced = segments.slice(-Math.min(depth, segments.length));
  return sliced.join('/');
}

export interface CostInfo {
  totalCostUsd: number | null;
  totalDurationMs: number | null;
  totalApiDurationMs: number | null;
  totalLinesAdded: number | null;
  totalLinesRemoved: number | null;
}

export function getCost(stdin: Partial<StdinData>): CostInfo {
  const cost = stdin.cost;
  return {
    totalCostUsd: cost?.total_cost_usd ?? null,
    totalDurationMs: cost?.total_duration_ms ?? null,
    totalApiDurationMs: cost?.total_api_duration_ms ?? null,
    totalLinesAdded: cost?.total_lines_added ?? null,
    totalLinesRemoved: cost?.total_lines_removed ?? null,
  };
}

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

export function getContextWindow(stdin: Partial<StdinData>): ContextWindowInfo {
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

export function getVersion(stdin: Partial<StdinData>): string | null {
  return stdin.version ?? null;
}
