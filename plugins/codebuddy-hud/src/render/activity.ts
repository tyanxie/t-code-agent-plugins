import { getIcon } from './icons.js';
import { dim } from './colors.js';
import type { RenderContext, ToolEntry, AgentEntry, TaskItem } from '../types.js';

function toolStatusLabel(status: ToolEntry['status']): string {
  if (status === 'completed') return 'ok';
  if (status === 'running') return 'run';
  return 'err';
}

function renderToolsSegment(tools: ToolEntry[]): string | null {
  if (tools.length === 0) return null;

  const recent = tools.slice(-3);
  const recentParts = recent.map(t => `${t.name} ${toolStatusLabel(t.status)}`);

  const okCount = tools.filter(t => t.status === 'completed').length;
  const errCount = tools.filter(t => t.status === 'error').length;
  const summaryParts: string[] = [];
  if (okCount > 0) summaryParts.push(`ok:${okCount}`);
  if (errCount > 0) summaryParts.push(`err:${errCount}`);
  const summary = summaryParts.length > 0 ? ` ${dim(`[${summaryParts.join(' ')}]`)}` : '';

  const icon = getIcon('tools');
  return `${icon} ${recentParts.join(' > ')}${summary}`;
}

function renderAgentsSegment(agents: AgentEntry[]): string | null {
  if (agents.length === 0) return null;

  const running = agents.filter(a => a.status === 'running');
  const icon = getIcon('agents');

  if (running.length > 0) {
    const parts = running.map(a => `${a.type}(run)`);
    return `${icon} ${parts.join(' ')}`;
  }

  // All completed — show most recent
  const last = agents[agents.length - 1];
  return `${icon} ${last.type}(done)`;
}

function renderTasksSegment(tasks: TaskItem[]): string | null {
  if (tasks.length === 0) return null;

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const filled = Math.round((completed / total) * 5);
  const bar = '#'.repeat(filled) + '-'.repeat(5 - filled);

  const icon = getIcon('tasks');
  return `${icon} [${bar}] ${completed}/${total}`;
}

export function renderActivityLine(ctx: RenderContext): string | null {
  const { config, transcript } = ctx;
  const { display } = config;

  const segments: string[] = [];

  if (display.tools) {
    const seg = renderToolsSegment(transcript.tools);
    if (seg) segments.push(seg);
  }

  if (display.agents) {
    const seg = renderAgentsSegment(transcript.agents);
    if (seg) segments.push(seg);
  }

  if (display.tasks) {
    const seg = renderTasksSegment(transcript.tasks);
    if (seg) segments.push(seg);
  }

  if (segments.length === 0) return null;

  return segments.join(' | ');
}
