import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { colorize, dim, bold, RESET } from '../dist/render/colors.js';
import { stripAnsi, visualLength, truncateToWidth } from '../dist/render/width.js';
import { getIcon } from '../dist/render/icons.js';

// ── colors ──────────────────────────────────────────────────────────

describe('colors', () => {
  it('colorize with named color (red)', () => {
    const result = colorize('hello', 'red');
    assert.equal(result, '\x1b[31mhello\x1b[0m');
  });

  it('colorize with 256-color index', () => {
    const result = colorize('hello', 208);
    assert.equal(result, '\x1b[38;5;208mhello\x1b[0m');
  });

  it('colorize with hex color', () => {
    const result = colorize('hello', '#ff8800');
    assert.equal(result, '\x1b[38;2;255;136;0mhello\x1b[0m');
  });

  it('colorize with short hex color (#f80)', () => {
    const result = colorize('hello', '#f80');
    assert.equal(result, '\x1b[38;2;255;136;0mhello\x1b[0m');
  });

  it('dim wraps text', () => {
    const result = dim('test');
    assert.equal(result, '\x1b[2mtest\x1b[0m');
  });

  it('bold wraps text', () => {
    const result = bold('test');
    assert.equal(result, '\x1b[1mtest\x1b[0m');
  });

  it('RESET is correct', () => {
    assert.equal(RESET, '\x1b[0m');
  });
});

// ── width ───────────────────────────────────────────────────────────

describe('width', () => {
  it('stripAnsi removes escape codes', () => {
    assert.equal(stripAnsi('\x1b[31mhello\x1b[0m'), 'hello');
  });

  it('stripAnsi returns plain string unchanged', () => {
    assert.equal(stripAnsi('hello'), 'hello');
  });

  it('visualLength of plain ASCII', () => {
    assert.equal(visualLength('hello'), 5);
  });

  it('visualLength ignores ANSI codes', () => {
    assert.equal(visualLength('\x1b[31mhello\x1b[0m'), 5);
  });

  it('visualLength counts CJK as width 2', () => {
    assert.equal(visualLength('你好'), 4);
  });

  it('visualLength handles mixed ASCII and CJK', () => {
    assert.equal(visualLength('ab你好cd'), 8);
  });

  it('truncateToWidth returns original if within limit', () => {
    assert.equal(truncateToWidth('hello', 10), 'hello');
  });

  it('truncateToWidth adds ellipsis when exceeding', () => {
    const result = truncateToWidth('hello world', 8);
    assert.equal(stripAnsi(result), 'hello...');
  });

  it('truncateToWidth handles very small max', () => {
    const result = truncateToWidth('hello', 2);
    assert.equal(stripAnsi(result), '..');
  });
});

// ── icons ───────────────────────────────────────────────────────────

describe('icons', () => {
  it('returns emoji icon for cost', () => {
    assert.equal(getIcon('cost'), '💰');
  });

  it('returns emoji icon for duration', () => {
    assert.equal(getIcon('duration'), '⏱️');
  });

  it('returns emoji for all keys', () => {
    const keys: Array<'cost' | 'duration' | 'diff' | 'tools' | 'agents' | 'tasks'> = [
      'cost', 'duration', 'diff', 'tools', 'agents', 'tasks',
    ];
    for (const key of keys) {
      const result = getIcon(key);
      assert.ok(result.length > 0, `emoji icon for ${key} should not be empty`);
    }
  });
});
