import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, mergeConfig, validateConfig } from '../dist/config.js';

describe('DEFAULT_CONFIG', () => {
  it('has compact layout', () => {
    assert.equal(DEFAULT_CONFIG.layout, 'compact');
  });
  it('has version disabled by default', () => {
    assert.equal(DEFAULT_CONFIG.display.version, false);
  });
});

describe('mergeConfig', () => {
  it('returns default for empty override', () => {
    const result = mergeConfig({});
    assert.deepEqual(result, DEFAULT_CONFIG);
  });
  it('overrides layout', () => {
    const result = mergeConfig({ layout: 'compact' });
    assert.equal(result.layout, 'compact');
  });
  it('deep merges display', () => {
    const result = mergeConfig({ display: { version: true } });
    assert.equal(result.display.version, true);
    assert.equal(result.display.model, true);
  });
  it('deep merges colors', () => {
    const result = mergeConfig({ colors: { model: 'red' } });
    assert.equal(result.colors.model, 'red');
    assert.equal(result.colors.project, 'green');
  });
});

describe('validateConfig', () => {
  it('accepts valid config', () => {
    assert.ok(validateConfig(DEFAULT_CONFIG));
  });
  it('rejects invalid layout', () => {
    assert.ok(!validateConfig({ ...DEFAULT_CONFIG, layout: 'invalid' as any }));
  });
  it('rejects negative projectDepth', () => {
    const bad = { ...DEFAULT_CONFIG, display: { ...DEFAULT_CONFIG.display, projectDepth: -1 } };
    assert.ok(!validateConfig(bad));
  });
});
