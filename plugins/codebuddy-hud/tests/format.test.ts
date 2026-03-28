import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatDuration, formatCost, formatDiff, formatTokenCount, formatPercentage } from '../dist/utils/format.js';

describe('formatDuration', () => {
  it('returns empty string for null/undefined', () => {
    assert.equal(formatDuration(null), '');
    assert.equal(formatDuration(undefined), '');
  });
  it('formats seconds for <1m', () => {
    assert.equal(formatDuration(45000), '45s');
  });
  it('formats minutes and seconds for <1h', () => {
    assert.equal(formatDuration(332000), '5m32s');
  });
  it('formats hours and minutes for >=1h', () => {
    assert.equal(formatDuration(3720000), '1h2m');
  });
  it('returns 0s for 0', () => {
    assert.equal(formatDuration(0), '0s');
  });
});

describe('formatCost', () => {
  it('returns empty string for null/undefined', () => {
    assert.equal(formatCost(null), '');
  });
  it('formats small cost with 4 decimals', () => {
    assert.equal(formatCost(0.0123), '$0.0123');
  });
  it('formats larger cost with 2 decimals', () => {
    assert.equal(formatCost(1.5), '$1.50');
  });
  it('formats zero', () => {
    assert.equal(formatCost(0), '$0.00');
  });
});

describe('formatDiff', () => {
  it('returns empty string for null values', () => {
    assert.equal(formatDiff(null, null), '');
  });
  it('formats added and removed', () => {
    assert.equal(formatDiff(156, 23), '+156/-23');
  });
  it('formats zero changes', () => {
    assert.equal(formatDiff(0, 0), '+0/-0');
  });
});

describe('formatTokenCount', () => {
  it('returns empty string for null/undefined', () => {
    assert.equal(formatTokenCount(null), '');
    assert.equal(formatTokenCount(undefined), '');
  });
  it('formats millions', () => {
    assert.equal(formatTokenCount(2010866), '2.0M');
  });
  it('formats thousands', () => {
    assert.equal(formatTokenCount(60324), '60.3K');
  });
  it('formats exact thousand boundary', () => {
    assert.equal(formatTokenCount(1000), '1.0K');
  });
  it('formats small numbers as-is', () => {
    assert.equal(formatTokenCount(656), '656');
  });
  it('formats zero', () => {
    assert.equal(formatTokenCount(0), '0');
  });
  it('formats exact million boundary', () => {
    assert.equal(formatTokenCount(1000000), '1.0M');
  });
});

describe('formatPercentage', () => {
  it('returns empty string for null/undefined', () => {
    assert.equal(formatPercentage(null), '');
    assert.equal(formatPercentage(undefined), '');
  });
  it('rounds to nearest integer', () => {
    assert.equal(formatPercentage(6.03), '6%');
    assert.equal(formatPercentage(50.4), '50%');
    assert.equal(formatPercentage(99.9), '100%');
  });
  it('formats zero', () => {
    assert.equal(formatPercentage(0), '0%');
  });
  it('formats 100', () => {
    assert.equal(formatPercentage(100), '100%');
  });
});
