import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getGitStatus } from '../dist/git.js';

describe('getGitStatus', () => {
  it('returns null for undefined cwd', async () => {
    const result = await getGitStatus(undefined);
    assert.equal(result, null);
  });

  it('returns null for non-git directory', async () => {
    const result = await getGitStatus('/tmp');
    assert.equal(result, null);
  });

  it('returns branch info for a git repo', async () => {
    // 当前仓库就是一个 git repo
    const result = await getGitStatus(process.cwd());
    assert.notEqual(result, null);
    assert.ok(typeof result!.branch === 'string');
    assert.ok(result!.branch.length > 0);
    assert.ok(typeof result!.isDirty === 'boolean');
  });
});
