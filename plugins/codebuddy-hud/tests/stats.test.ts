import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderStatsLine } from '../dist/render/stats.js';
import { stripAnsi } from '../dist/render/width.js';
import type { RenderContext } from '../dist/types.js';

function makeCtx(overrides?: Partial<{
  cost: boolean;
  duration: boolean;
  diff: boolean;
  totalCostUsd: number | null;
  totalDurationMs: number | null;
  totalLinesAdded: number | null;
  totalLinesRemoved: number | null;
  costWarning: number;
  costCritical: number;
  contextUsage: boolean;
  contextValues: boolean;
  contextWarning: number;
  contextCritical: number;
  usedPercentage: number | null;
  currentInputTokens: number | null;
  contextWindowSize: number | null;
}>): RenderContext {
  const o = {
    cost: true,
    duration: true,
    diff: true,
    totalCostUsd: 0.0234 as number | null,
    totalDurationMs: 332000 as number | null,
    totalLinesAdded: 156 as number | null,
    totalLinesRemoved: 23 as number | null,
    costWarning: 5,
    costCritical: 10,
    contextUsage: false,
    contextValues: false,
    contextWarning: 50,
    contextCritical: 80,
    usedPercentage: null as number | null,
    currentInputTokens: null as number | null,
    contextWindowSize: null as number | null,
    ...overrides,
  };
  return {
    stdin: {
      cost: {
        total_cost_usd: o.totalCostUsd ?? undefined,
        total_duration_ms: o.totalDurationMs ?? undefined,
        total_lines_added: o.totalLinesAdded ?? undefined,
        total_lines_removed: o.totalLinesRemoved ?? undefined,
      },
      context_window: o.usedPercentage != null ? {
        used_percentage: o.usedPercentage,
        current_usage: o.currentInputTokens != null ? { input_tokens: o.currentInputTokens } : undefined,
        context_window_size: o.contextWindowSize ?? undefined,
      } : undefined,
    },
    transcript: { tools: [], agents: [], tasks: [] },
    gitStatus: null,
    config: {
      layout: 'expanded',
      display: {
        model: false,
        project: false,
        projectDepth: 1,
        git: false,
        version: false,
        cost: o.cost,
        duration: o.duration,
        diff: o.diff,
        contextUsage: o.contextUsage,
        contextValues: o.contextValues,
        tools: false,
        agents: false,
        tasks: false,
      },
      colors: {
        model: 'cyan',
        project: 'green',
        git: 'yellow',
        cost: 'cyan',
        costWarning: o.costWarning,
        costCritical: o.costCritical,
        contextWarning: o.contextWarning,
        contextCritical: o.contextCritical,
      },
      git: {
        dirty: false,
        aheadBehind: false,
      },
    },
  };
}

describe('renderStatsLine', () => {
  it('full display: cost + duration + diff', () => {
    const ctx = makeCtx();
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.equal(plain, '💰 $0.0234 | ⏱️ 5m32s | 📝 +156/-23');
  });

  it('hides cost when display.cost is false', () => {
    const ctx = makeCtx({ cost: false });
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.equal(plain, '⏱️ 5m32s | 📝 +156/-23');
  });

  it('hides duration when display.duration is false', () => {
    const ctx = makeCtx({ duration: false });
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.equal(plain, '💰 $0.0234 | 📝 +156/-23');
  });

  it('hides diff when display.diff is false', () => {
    const ctx = makeCtx({ diff: false });
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.equal(plain, '💰 $0.0234 | ⏱️ 5m32s');
  });

  it('cost normal color (below warning threshold)', () => {
    const ctx = makeCtx({ totalCostUsd: 2.0, costWarning: 5, costCritical: 10 });
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    // cyan color code for normal cost
    assert.ok(line!.includes('\x1b[36m'));
  });

  it('cost warning color (at or above warning, below critical)', () => {
    const ctx = makeCtx({ totalCostUsd: 5.0, costWarning: 5, costCritical: 10 });
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    // yellow color code for warning
    assert.ok(line!.includes('\x1b[33m'));
  });

  it('cost critical color (at or above critical)', () => {
    const ctx = makeCtx({ totalCostUsd: 10.0, costWarning: 5, costCritical: 10 });
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    // red color code for critical
    assert.ok(line!.includes('\x1b[31m'));
  });

  it('returns null when all data is absent', () => {
    const ctx = makeCtx({
      totalCostUsd: null,
      totalDurationMs: null,
      totalLinesAdded: null,
      totalLinesRemoved: null,
    });
    const line = renderStatsLine(ctx);
    assert.equal(line, null);
  });

  it('returns null when all display flags are off', () => {
    const ctx = makeCtx({ cost: false, duration: false, diff: false });
    const line = renderStatsLine(ctx);
    assert.equal(line, null);
  });

  it('only cost data present shows only cost', () => {
    const ctx = makeCtx({
      totalDurationMs: null,
      totalLinesAdded: null,
      totalLinesRemoved: null,
    });
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.equal(plain, '💰 $0.0234');
  });

  it('hides cost when totalCostUsd is 0', () => {
    const ctx = makeCtx({ totalCostUsd: 0 });
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.ok(!plain.includes('cost:'));
    assert.ok(!plain.includes('$'));
  });

  it('shows context bar when contextUsage enabled and data present', () => {
    const ctx = makeCtx({ contextUsage: true, usedPercentage: 45 });
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.ok(plain.includes('Context'));
    assert.ok(plain.includes('45%'));
  });

  it('context bar not shown when contextUsage disabled', () => {
    const ctx = makeCtx({ contextUsage: false, usedPercentage: 45 });
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.ok(!plain.includes('45%'));
  });

  it('context bar shows 0% when usedPercentage is null', () => {
    const ctx = makeCtx({ contextUsage: true, usedPercentage: null });
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.ok(plain.includes('0%'));
  });

  it('context bar shows values when contextValues enabled', () => {
    const ctx = makeCtx({
      contextUsage: true,
      contextValues: true,
      usedPercentage: 6,
      currentInputTokens: 60324,
      contextWindowSize: 1000000,
    });
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.ok(plain.includes('60.3K/1.0M'));
  });

  it('context bar uses cyan for low usage', () => {
    const ctx = makeCtx({ contextUsage: true, usedPercentage: 10, contextWarning: 50, contextCritical: 80 });
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    assert.ok(line!.includes('\x1b[36m')); // cyan
  });

  it('context bar uses yellow for warning usage', () => {
    const ctx = makeCtx({ contextUsage: true, usedPercentage: 60, contextWarning: 50, contextCritical: 80 });
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    assert.ok(line!.includes('\x1b[33m')); // yellow
  });

  it('context bar uses red for critical usage', () => {
    const ctx = makeCtx({ contextUsage: true, usedPercentage: 90, contextWarning: 50, contextCritical: 80 });
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    assert.ok(line!.includes('\x1b[31m')); // red
  });

  it('context bar without label when includeContext false', () => {
    const ctx = makeCtx({ contextUsage: true, usedPercentage: 45 });
    const line = renderStatsLine(ctx, { includeContext: false });
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.ok(!plain.includes('Context'));
    assert.ok(!plain.includes('45%'));
  });

  it('progress bar uses unicode block chars', () => {
    const ctx = makeCtx({ contextUsage: true, usedPercentage: 50 });
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.ok(plain.includes('\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591'));
  });

  it('uses emoji icons', () => {
    const ctx = makeCtx();
    const line = renderStatsLine(ctx);
    assert.ok(line !== null);
    assert.ok(line!.includes('💰'));
  });
});
