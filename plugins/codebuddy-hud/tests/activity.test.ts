import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderActivityLine } from '../dist/render/activity.js';
import { stripAnsi } from '../dist/render/width.js';
import type { RenderContext, ToolEntry, AgentEntry, TaskItem } from '../dist/types.js';

function makeTool(name: string, status: ToolEntry['status'], minutesAgo: number): ToolEntry {
  const start = new Date(Date.now() - minutesAgo * 60000);
  return {
    id: `tool-${name}-${minutesAgo}`,
    name,
    status,
    startTime: start,
    endTime: status !== 'running' ? new Date(start.getTime() + 5000) : undefined,
  };
}

function makeAgent(type: string, status: AgentEntry['status']): AgentEntry {
  const start = new Date(Date.now() - 60000);
  return {
    id: `agent-${type}`,
    type,
    status,
    startTime: start,
    endTime: status === 'completed' ? new Date() : undefined,
  };
}

function makeTask(status: TaskItem['status']): TaskItem {
  return { content: `task-${status}`, status };
}

function makeCtx(overrides?: Partial<{
  tools: ToolEntry[];
  agents: AgentEntry[];
  tasks: TaskItem[];
  displayTools: boolean;
  displayAgents: boolean;
  displayTasks: boolean;
}>): RenderContext {
  const o = {
    tools: [] as ToolEntry[],
    agents: [] as AgentEntry[],
    tasks: [] as TaskItem[],
    displayTools: true,
    displayAgents: true,
    displayTasks: true,
    ...overrides,
  };
  return {
    stdin: {},
    transcript: {
      tools: o.tools,
      agents: o.agents,
      tasks: o.tasks,
    },
    gitStatus: null,
    config: {
      layout: 'expanded',
      display: {
        model: false,
        project: false,
        projectDepth: 1,
        git: false,
        version: false,
        cost: false,
        duration: false,
        diff: false,
        tools: o.displayTools,
        agents: o.displayAgents,
        tasks: o.displayTasks,
      },
      colors: {
        model: 'cyan',
        project: 'green',
        git: 'yellow',
        cost: 'cyan',
        costWarning: 5,
        costCritical: 10,
      },
      git: {
        dirty: false,
        aheadBehind: false,
      },
    },
  };
}

describe('renderActivityLine', () => {
  describe('tools segment', () => {
    it('shows recent tools with status and summary', () => {
      const tools = [
        makeTool('Read', 'completed', 5),
        makeTool('Bash', 'running', 1),
      ];
      const ctx = makeCtx({ tools, displayAgents: false, displayTasks: false });
      const line = renderActivityLine(ctx);
      assert.ok(line !== null);
      const plain = stripAnsi(line!);
      assert.ok(plain.includes('Read ok'));
      assert.ok(plain.includes('Bash run'));
      assert.ok(plain.includes('[ok:1'));
    });

    it('shows last 3 tools only', () => {
      const tools = [
        makeTool('Read', 'completed', 10),
        makeTool('Grep', 'completed', 8),
        makeTool('Bash', 'error', 5),
        makeTool('Write', 'completed', 2),
      ];
      const ctx = makeCtx({ tools, displayAgents: false, displayTasks: false });
      const line = renderActivityLine(ctx);
      assert.ok(line !== null);
      const plain = stripAnsi(line!);
      // Should not include the oldest tool (Read)
      assert.ok(!plain.includes('Read ok'));
      // Should include the 3 most recent
      assert.ok(plain.includes('Grep ok'));
      assert.ok(plain.includes('Bash err'));
      assert.ok(plain.includes('Write ok'));
    });

    it('summary shows only nonzero counts', () => {
      const tools = [
        makeTool('Read', 'completed', 3),
        makeTool('Bash', 'completed', 1),
      ];
      const ctx = makeCtx({ tools, displayAgents: false, displayTasks: false });
      const line = renderActivityLine(ctx);
      assert.ok(line !== null);
      const plain = stripAnsi(line!);
      assert.ok(plain.includes('ok:2'));
      assert.ok(!plain.includes('err:'));
    });

    it('summary includes error count when present', () => {
      const tools = [
        makeTool('Read', 'completed', 3),
        makeTool('Bash', 'error', 2),
        makeTool('Write', 'running', 1),
      ];
      const ctx = makeCtx({ tools, displayAgents: false, displayTasks: false });
      const line = renderActivityLine(ctx);
      assert.ok(line !== null);
      const plain = stripAnsi(line!);
      assert.ok(plain.includes('ok:1'));
      assert.ok(plain.includes('err:1'));
    });
  });

  describe('agents segment', () => {
    it('shows running agents', () => {
      const agents = [makeAgent('Explore', 'running')];
      const ctx = makeCtx({ agents, displayTools: false, displayTasks: false });
      const line = renderActivityLine(ctx);
      assert.ok(line !== null);
      const plain = stripAnsi(line!);
      assert.ok(plain.includes('Explore(run)'));
    });

    it('shows most recent completed agent when none running', () => {
      const agents = [
        makeAgent('Explore', 'completed'),
        makeAgent('Code', 'completed'),
      ];
      const ctx = makeCtx({ agents, displayTools: false, displayTasks: false });
      const line = renderActivityLine(ctx);
      assert.ok(line !== null);
      const plain = stripAnsi(line!);
      assert.ok(plain.includes('(done)'));
    });

    it('shows multiple running agents', () => {
      const agents = [
        makeAgent('Explore', 'running'),
        makeAgent('Code', 'running'),
      ];
      const ctx = makeCtx({ agents, displayTools: false, displayTasks: false });
      const line = renderActivityLine(ctx);
      assert.ok(line !== null);
      const plain = stripAnsi(line!);
      assert.ok(plain.includes('Explore(run)'));
      assert.ok(plain.includes('Code(run)'));
    });
  });

  describe('tasks segment', () => {
    it('shows progress bar for partial completion', () => {
      const tasks = [
        makeTask('completed'),
        makeTask('completed'),
        makeTask('in_progress'),
        makeTask('pending'),
        makeTask('pending'),
      ];
      const ctx = makeCtx({ tasks, displayTools: false, displayAgents: false });
      const line = renderActivityLine(ctx);
      assert.ok(line !== null);
      const plain = stripAnsi(line!);
      assert.ok(plain.includes('[##---]'));
      assert.ok(plain.includes('2/5'));
    });

    it('shows full progress bar when all completed', () => {
      const tasks = [
        makeTask('completed'),
        makeTask('completed'),
        makeTask('completed'),
      ];
      const ctx = makeCtx({ tasks, displayTools: false, displayAgents: false });
      const line = renderActivityLine(ctx);
      assert.ok(line !== null);
      const plain = stripAnsi(line!);
      assert.ok(plain.includes('[#####]'));
      assert.ok(plain.includes('3/3'));
    });

    it('shows empty progress bar when none completed', () => {
      const tasks = [
        makeTask('pending'),
        makeTask('pending'),
      ];
      const ctx = makeCtx({ tasks, displayTools: false, displayAgents: false });
      const line = renderActivityLine(ctx);
      assert.ok(line !== null);
      const plain = stripAnsi(line!);
      assert.ok(plain.includes('[-----]'));
      assert.ok(plain.includes('0/2'));
    });
  });

  describe('segment toggling', () => {
    it('hides tools when display.tools is false', () => {
      const tools = [makeTool('Read', 'completed', 1)];
      const agents = [makeAgent('Explore', 'running')];
      const ctx = makeCtx({ tools, agents, displayTools: false, displayTasks: false });
      const line = renderActivityLine(ctx);
      assert.ok(line !== null);
      const plain = stripAnsi(line!);
      assert.ok(!plain.includes('Read'));
      assert.ok(plain.includes('Explore'));
    });

    it('hides agents when display.agents is false', () => {
      const tools = [makeTool('Read', 'completed', 1)];
      const agents = [makeAgent('Explore', 'running')];
      const ctx = makeCtx({ tools, agents, displayAgents: false, displayTasks: false });
      const line = renderActivityLine(ctx);
      assert.ok(line !== null);
      const plain = stripAnsi(line!);
      assert.ok(plain.includes('Read'));
      assert.ok(!plain.includes('Explore'));
    });

    it('hides tasks when display.tasks is false', () => {
      const tasks = [makeTask('completed'), makeTask('pending')];
      const ctx = makeCtx({ tasks, displayTools: false, displayAgents: false, displayTasks: false });
      const line = renderActivityLine(ctx);
      assert.equal(line, null);
    });
  });

  describe('combined segments', () => {
    it('joins segments with pipe separator', () => {
      const tools = [makeTool('Read', 'completed', 1)];
      const agents = [makeAgent('Explore', 'running')];
      const tasks = [makeTask('completed'), makeTask('pending')];
      const ctx = makeCtx({ tools, agents, tasks });
      const line = renderActivityLine(ctx);
      assert.ok(line !== null);
      const plain = stripAnsi(line!);
      // Should have pipe separators between segments
      const pipes = plain.split(' | ');
      assert.equal(pipes.length, 3);
    });
  });

  describe('null return', () => {
    it('returns null when no data at all', () => {
      const ctx = makeCtx();
      const line = renderActivityLine(ctx);
      assert.equal(line, null);
    });

    it('returns null when all display flags off', () => {
      const tools = [makeTool('Read', 'completed', 1)];
      const agents = [makeAgent('Explore', 'running')];
      const tasks = [makeTask('completed')];
      const ctx = makeCtx({
        tools, agents, tasks,
        displayTools: false,
        displayAgents: false,
        displayTasks: false,
      });
      const line = renderActivityLine(ctx);
      assert.equal(line, null);
    });
  });
});
