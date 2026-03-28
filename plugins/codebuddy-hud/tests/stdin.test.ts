// tests/stdin.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseStdinData, getModelName, getProjectPath, getCost, getVersion, getContextWindow } from '../dist/stdin.js';

const sampleStdin = {
  hook_event_name: 'Status',
  session_id: 'abc123',
  transcript_path: '/tmp/transcript.jsonl',
  cwd: '/project/t-code-agent-plugins',
  model: { id: 'claude-opus-4-20250514', display_name: 'Claude-Opus-4.6-1M' },
  workspace: {
    current_dir: '/project/t-code-agent-plugins',
    project_dir: '/project/t-code-agent-plugins',
  },
  version: '2.9.0',
  cost: {
    total_cost_usd: 0.0234,
    total_duration_ms: 332000,
    total_api_duration_ms: 2300,
    total_lines_added: 156,
    total_lines_removed: 23,
  },
};

describe('parseStdinData', () => {
  it('parses valid JSON string', () => {
    const result = parseStdinData(JSON.stringify(sampleStdin));
    assert.equal(result?.model?.display_name, 'Claude-Opus-4.6-1M');
  });
  it('returns null for invalid JSON', () => {
    assert.equal(parseStdinData('not json'), null);
  });
  it('returns null for empty string', () => {
    assert.equal(parseStdinData(''), null);
  });
});

describe('getModelName', () => {
  it('returns display_name', () => {
    assert.equal(getModelName(sampleStdin), 'Claude-Opus-4.6-1M');
  });
  it('falls back to id', () => {
    assert.equal(getModelName({ model: { id: 'gpt-5' } }), 'gpt-5');
  });
  it('returns unknown for missing model', () => {
    assert.equal(getModelName({}), 'unknown');
  });
});

describe('getProjectPath', () => {
  it('returns last segment with depth 1', () => {
    assert.equal(getProjectPath(sampleStdin, 1), 't-code-agent-plugins');
  });
  it('returns last 2 segments with depth 2', () => {
    assert.equal(getProjectPath(sampleStdin, 2), 'project/t-code-agent-plugins');
  });
  it('returns full path if depth exceeds segments', () => {
    const data = { workspace: { current_dir: '/a/b' } };
    assert.equal(getProjectPath(data, 10), 'a/b');
  });
});

describe('getCost', () => {
  it('extracts cost fields', () => {
    const cost = getCost(sampleStdin);
    assert.equal(cost.totalCostUsd, 0.0234);
    assert.equal(cost.totalDurationMs, 332000);
    assert.equal(cost.totalLinesAdded, 156);
    assert.equal(cost.totalLinesRemoved, 23);
  });
  it('returns nulls for missing cost', () => {
    const cost = getCost({});
    assert.equal(cost.totalCostUsd, null);
  });
});

describe('getVersion', () => {
  it('returns version string', () => {
    assert.equal(getVersion(sampleStdin), '2.9.0');
  });
  it('returns null for missing', () => {
    assert.equal(getVersion({}), null);
  });
});

describe('getContextWindow', () => {
  const stdinWithContext = {
    ...sampleStdin,
    context_window: {
      total_input_tokens: 2010866,
      total_output_tokens: 21788,
      context_window_size: 1000000,
      current_usage: {
        input_tokens: 60324,
        output_tokens: 656,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 486738,
      },
      used_percentage: 6.03,
      remaining_percentage: 93.97,
    },
  };

  it('extracts all context window fields', () => {
    const cw = getContextWindow(stdinWithContext);
    assert.equal(cw.totalInputTokens, 2010866);
    assert.equal(cw.totalOutputTokens, 21788);
    assert.equal(cw.contextWindowSize, 1000000);
    assert.equal(cw.currentInputTokens, 60324);
    assert.equal(cw.currentOutputTokens, 656);
    assert.equal(cw.cacheCreationTokens, 0);
    assert.equal(cw.cacheReadTokens, 486738);
    assert.equal(cw.usedPercentage, 6.03);
    assert.equal(cw.remainingPercentage, 93.97);
  });

  it('returns nulls when context_window is missing', () => {
    const cw = getContextWindow({});
    assert.equal(cw.totalInputTokens, null);
    assert.equal(cw.usedPercentage, null);
    assert.equal(cw.contextWindowSize, null);
  });

  it('returns nulls when current_usage is missing', () => {
    const cw = getContextWindow({ context_window: { used_percentage: 50 } });
    assert.equal(cw.currentInputTokens, null);
    assert.equal(cw.usedPercentage, 50);
  });
});
