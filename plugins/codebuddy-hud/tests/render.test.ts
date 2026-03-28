import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../dist/render/index.js';
import { stripAnsi } from '../dist/render/width.js';
import type { RenderContext } from '../dist/types.js';

function makeCtx(overrides?: Partial<{
  layout: 'expanded' | 'compact';
  model: boolean;
  project: boolean;
  git: boolean;
  version: boolean;
  cost: boolean;
  duration: boolean;
  diff: boolean;
  tools: boolean;
  agents: boolean;
  tasks: boolean;
  contextUsage: boolean;
  contextValues: boolean;
  contextWarning: number;
  contextCritical: number;
  usedPercentage: number | null;
  totalCostUsd: number | null;
  totalDurationMs: number | null;
  totalLinesAdded: number | null;
  totalLinesRemoved: number | null;
}>): RenderContext {
  const o = {
    layout: 'expanded' as const,
    model: true,
    project: true,
    git: true,
    version: false,
    cost: true,
    duration: true,
    diff: true,
    tools: true,
    agents: false,
    tasks: false,
    contextUsage: false,
    contextValues: false,
    contextWarning: 50,
    contextCritical: 80,
    usedPercentage: null as number | null,
    totalCostUsd: 0.0234 as number | null,
    totalDurationMs: 332000 as number | null,
    totalLinesAdded: 156 as number | null,
    totalLinesRemoved: 23 as number | null,
    ...overrides,
  };
  return {
    stdin: {
      model: { id: 'claude-opus-4-20250514', display_name: 'Claude-Opus-4' },
      workspace: { current_dir: '/project/demo/t-code-agent-plugins' },
      version: '2.9.0',
      cost: {
        total_cost_usd: o.totalCostUsd ?? undefined,
        total_duration_ms: o.totalDurationMs ?? undefined,
        total_lines_added: o.totalLinesAdded ?? undefined,
        total_lines_removed: o.totalLinesRemoved ?? undefined,
      },
      context_window: o.usedPercentage != null ? {
        used_percentage: o.usedPercentage,
      } : undefined,
    },
    transcript: {
      tools: [
        {
          id: 't1',
          name: 'Read',
          target: '/foo/bar.ts',
          status: 'completed',
          startTime: new Date('2025-01-01T00:00:00Z'),
          endTime: new Date('2025-01-01T00:00:01Z'),
        },
      ],
      agents: [],
      tasks: [],
    },
    gitStatus: {
      branch: 'main',
      isDirty: true,
      ahead: 0,
      behind: 0,
    },
    config: {
      layout: o.layout,
      icons: 'text',
      display: {
        model: o.model,
        project: o.project,
        projectDepth: 1,
        git: o.git,
        version: o.version,
        cost: o.cost,
        duration: o.duration,
        diff: o.diff,
        tools: o.tools,
        agents: o.agents,
        tasks: o.tasks,
        contextUsage: o.contextUsage,
        contextValues: o.contextValues,
      },
      colors: {
        model: 'cyan',
        project: 'green',
        git: 'yellow',
        cost: 'cyan',
        costWarning: 5,
        costCritical: 10,
        contextWarning: o.contextWarning,
        contextCritical: o.contextCritical,
      },
      git: {
        dirty: true,
        aheadBehind: false,
      },
    },
  };
}

describe('render', () => {
  let captured: string[];
  let origLog: typeof console.log;

  beforeEach(() => {
    captured = [];
    origLog = console.log;
    console.log = (...args: unknown[]) => {
      captured.push(args.map(String).join(' '));
    };
  });

  afterEach(() => {
    console.log = origLog;
  });

  it('expanded mode outputs multiple lines (identity + stats + activity)', () => {
    const ctx = makeCtx({ layout: 'expanded' });
    render(ctx);
    assert.ok(captured.length >= 3, `expected >= 3 lines, got ${captured.length}`);
    const plain = captured.map(l => stripAnsi(l));
    // Line 1: identity (model + project)
    assert.ok(plain[0].includes('[Claude-Opus-4]'));
    assert.ok(plain[0].includes('t-code-agent-plugins'));
    // Line 2: stats (cost + duration + diff)
    assert.ok(plain[1].includes('$0.0234'));
    assert.ok(plain[1].includes('5m32s'));
    // Line 3: activity (tools)
    assert.ok(plain[2].includes('Read'));
  });

  it('compact mode outputs single line (identity | stats merged)', () => {
    const ctx = makeCtx({ layout: 'compact', tools: false });
    render(ctx);
    assert.equal(captured.length, 1, `expected 1 line, got ${captured.length}`);
    const plain = stripAnsi(captured[0]);
    assert.ok(plain.includes('[Claude-Opus-4]'));
    assert.ok(plain.includes('$0.0234'));
  });

  it('empty data outputs only identity line', () => {
    const ctx = makeCtx({
      layout: 'expanded',
      cost: false,
      duration: false,
      diff: false,
      tools: false,
      agents: false,
      tasks: false,
    });
    ctx.transcript = { tools: [], agents: [], tasks: [] };
    render(ctx);
    assert.equal(captured.length, 1, `expected 1 line, got ${captured.length}`);
    const plain = stripAnsi(captured[0]);
    assert.ok(plain.includes('[Claude-Opus-4]'));
  });

  it('each line starts with ANSI reset', () => {
    const ctx = makeCtx({ layout: 'expanded' });
    render(ctx);
    for (const line of captured) {
      assert.ok(line.startsWith('\x1b[0m'), 'line should start with RESET');
    }
  });

  it('compact mode shows context bar after model name without label', () => {
    const ctx = makeCtx({ layout: 'compact', tools: false, contextUsage: true, usedPercentage: 30 });
    render(ctx);
    assert.equal(captured.length, 1);
    const plain = stripAnsi(captured[0]);
    // 进度条在紧凑模式下不带 Context 前缀
    assert.ok(!plain.includes('Context'));
    assert.ok(plain.includes('30%'));
    // 进度条在模型名和项目名之间
    const modelIdx = plain.indexOf('[Claude-Opus-4]');
    const pctIdx = plain.indexOf('30%');
    const projectIdx = plain.indexOf('t-code-agent-plugins');
    assert.ok(modelIdx < pctIdx);
    assert.ok(pctIdx < projectIdx);
  });

  it('expanded mode shows context bar with Context label in stats line', () => {
    const ctx = makeCtx({ layout: 'expanded', contextUsage: true, usedPercentage: 45 });
    render(ctx);
    assert.ok(captured.length >= 2);
    const statsPlain = stripAnsi(captured[1]);
    assert.ok(statsPlain.includes('Context'));
    assert.ok(statsPlain.includes('45%'));
  });
});
