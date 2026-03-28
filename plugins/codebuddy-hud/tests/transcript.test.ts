import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { parseTranscript } from '../dist/transcript.js';

const fixtureDir = path.join(import.meta.dirname, 'fixtures');
const samplePath = path.join(fixtureDir, 'sample-transcript.jsonl');

describe('parseTranscript - missing file', () => {
  it('returns empty data for non-existent file', async () => {
    const result = await parseTranscript(path.join(os.tmpdir(), 'does-not-exist-transcript.jsonl'));
    assert.deepEqual(result.tools, []);
    assert.deepEqual(result.agents, []);
    assert.deepEqual(result.tasks, []);
  });

  it('returns empty data for empty string path', async () => {
    const result = await parseTranscript('');
    assert.deepEqual(result.tools, []);
  });
});

describe('parseTranscript - tools', () => {
  it('parses tool_use entries from fixture', async () => {
    const result = await parseTranscript(samplePath);
    // fixture has: Read (tool_01), Bash (tool_02), Edit (tool_03), Bash (tool_04)
    // Task and TaskCreate/TaskUpdate are not counted as tools
    assert.ok(result.tools.length >= 3, `expected >= 3 tools, got ${result.tools.length}`);

    const readTool = result.tools.find(t => t.name === 'Read');
    assert.ok(readTool, 'should have Read tool');
    assert.equal(readTool.target, '/src/index.ts');

    const bashTools = result.tools.filter(t => t.name === 'Bash');
    assert.ok(bashTools.length >= 1, 'should have at least 1 Bash tool');
  });
});

describe('parseTranscript - agents', () => {
  it('parses Task (agent) entries from fixture', async () => {
    const result = await parseTranscript(samplePath);
    // fixture has: agent_01 (Explore), agent_02 (Code)
    assert.equal(result.agents.length, 2);

    const explore = result.agents.find(a => a.type === 'Explore');
    assert.ok(explore, 'should have Explore agent');
    assert.equal(explore.description, 'Search for error handling patterns');

    const code = result.agents.find(a => a.type === 'Code');
    assert.ok(code, 'should have Code agent');
    assert.equal(code.model, 'claude-sonnet');
  });
});

describe('parseTranscript - tasks', () => {
  it('parses TaskCreate and TaskUpdate events', async () => {
    const result = await parseTranscript(samplePath);
    // fixture creates 2 tasks, updates task 1 to in_progress then completed
    assert.equal(result.tasks.length, 2);

    assert.equal(result.tasks[0].content, 'Fix bug in parser');
    assert.equal(result.tasks[0].status, 'completed');

    assert.equal(result.tasks[1].content, 'Add unit tests');
    assert.equal(result.tasks[1].status, 'pending');
  });
});

describe('parseTranscript - tool status tracking', () => {
  it('marks completed tools correctly', async () => {
    const result = await parseTranscript(samplePath);

    const readTool = result.tools.find(t => t.name === 'Read');
    assert.ok(readTool);
    assert.equal(readTool.status, 'completed');
    assert.ok(readTool.endTime instanceof Date);
  });

  it('marks errored tools correctly', async () => {
    const result = await parseTranscript(samplePath);

    // tool_02 is Bash with is_error: true
    const errorBash = result.tools.find(t => t.id === 'tool_02');
    assert.ok(errorBash, 'should find Bash tool_02');
    assert.equal(errorBash.status, 'error');
  });

  it('marks tools without result as running', async () => {
    const result = await parseTranscript(samplePath);

    // tool_04 (last Bash) has no tool_result in fixture
    const runningBash = result.tools.find(t => t.id === 'tool_04');
    assert.ok(runningBash, 'should find Bash tool_04');
    assert.equal(runningBash.status, 'running');
    assert.equal(runningBash.endTime, undefined);
  });

  it('tracks agent completion status', async () => {
    const result = await parseTranscript(samplePath);

    const explore = result.agents.find(a => a.type === 'Explore');
    assert.ok(explore);
    assert.equal(explore.status, 'completed');

    const code = result.agents.find(a => a.type === 'Code');
    assert.ok(code);
    assert.equal(code.status, 'completed');
  });
});
