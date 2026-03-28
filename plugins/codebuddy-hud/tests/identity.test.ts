import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderIdentityLine } from '../dist/render/identity.js';
import { stripAnsi } from '../dist/render/width.js';
import type { RenderContext } from '../dist/types.js';

function makeCtx(overrides?: Partial<{
  layout: 'expanded' | 'compact';
  model: boolean;
  project: boolean;
  projectDepth: number;
  git: boolean;
  version: boolean;
  gitDirty: boolean;
  branch: string;
  isDirty: boolean;
}>): RenderContext {
  const o = {
    layout: 'expanded' as const,
    model: true,
    project: true,
    projectDepth: 1,
    git: true,
    version: true,
    gitDirty: true,
    branch: 'main',
    isDirty: true,
    ...overrides,
  };
  return {
    stdin: {
      model: { id: 'claude-opus-4-20250514', display_name: 'Claude-Opus-4' },
      workspace: { current_dir: '/project/demo/t-code-agent-plugins' },
      version: '2.9.0',
    },
    transcript: { tools: [], agents: [], tasks: [] },
    gitStatus: {
      branch: o.branch,
      isDirty: o.isDirty,
      ahead: 0,
      behind: 0,
    },
    config: {
      layout: o.layout,
      icons: 'text',
      display: {
        model: o.model,
        project: o.project,
        projectDepth: o.projectDepth,
        git: o.git,
        version: o.version,
        cost: false,
        duration: false,
        diff: false,
        tools: false,
        agents: false,
        tasks: false,
      },
      colors: {
        model: 'cyan',
        project: 'green',
        git: 'yellow',
        cost: 'red',
        costWarning: 5,
        costCritical: 10,
      },
      git: {
        dirty: o.gitDirty,
        aheadBehind: false,
      },
    },
  };
}

describe('renderIdentityLine', () => {
  it('full display: model + project + git + version', () => {
    const ctx = makeCtx();
    const line = renderIdentityLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.equal(plain, '[Claude-Opus-4] | t-code-agent-plugins (main*) | v2.9.0');
  });

  it('hides version in compact mode', () => {
    const ctx = makeCtx({ layout: 'compact', version: false });
    const line = renderIdentityLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.equal(plain, '[Claude-Opus-4] | t-code-agent-plugins (main*)');
  });

  it('hides git info', () => {
    const ctx = makeCtx({ git: false });
    const line = renderIdentityLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.equal(plain, '[Claude-Opus-4] | t-code-agent-plugins | v2.9.0');
  });

  it('hides model', () => {
    const ctx = makeCtx({ model: false });
    const line = renderIdentityLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.equal(plain, 't-code-agent-plugins (main*) | v2.9.0');
  });

  it('projectDepth=2 shows two segments', () => {
    const ctx = makeCtx({ projectDepth: 2 });
    const line = renderIdentityLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.equal(plain, '[Claude-Opus-4] | demo/t-code-agent-plugins (main*) | v2.9.0');
  });

  it('dirty marker hidden when git.dirty is false', () => {
    const ctx = makeCtx({ isDirty: true, gitDirty: false });
    const line = renderIdentityLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.equal(plain, '[Claude-Opus-4] | t-code-agent-plugins (main) | v2.9.0');
  });

  it('no dirty marker when isDirty is false', () => {
    const ctx = makeCtx({ isDirty: false });
    const line = renderIdentityLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.equal(plain, '[Claude-Opus-4] | t-code-agent-plugins (main) | v2.9.0');
  });

  it('returns null when all display flags are off', () => {
    const ctx = makeCtx({ model: false, project: false, git: false, version: false });
    const line = renderIdentityLine(ctx);
    assert.equal(line, null);
  });

  it('no gitStatus hides git info even if display.git is true', () => {
    const ctx = makeCtx();
    ctx.gitStatus = null;
    const line = renderIdentityLine(ctx);
    assert.ok(line !== null);
    const plain = stripAnsi(line!);
    assert.equal(plain, '[Claude-Opus-4] | t-code-agent-plugins | v2.9.0');
  });
});
