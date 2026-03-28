import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { HudConfig } from './types.js';

export const DEFAULT_CONFIG: HudConfig = {
  layout: 'compact',
  display: {
    model: true,
    project: true,
    projectDepth: 1,
    git: false,
    version: false,
    cost: false,
    duration: false,
    diff: false,
    tools: false,
    agents: false,
    tasks: false,
    contextUsage: true,
    contextValues: false,
  },
  colors: {
    model: 'blue',
    project: 'green',
    git: 'yellow',
    cost: 'cyan',
    costWarning: 0.10,
    costCritical: 0.50,
    contextWarning: 50,
    contextCritical: 80,
  },
  git: {
    dirty: true,
    aheadBehind: false,
  },
};

export function mergeConfig(override: Record<string, unknown>): HudConfig {
  const result = structuredClone(DEFAULT_CONFIG);
  if (override.layout) result.layout = override.layout as HudConfig['layout'];
  if (override.display && typeof override.display === 'object') {
    Object.assign(result.display, override.display);
  }
  if (override.colors && typeof override.colors === 'object') {
    Object.assign(result.colors, override.colors);
  }
  if (override.git && typeof override.git === 'object') {
    Object.assign(result.git, override.git);
  }
  return result;
}

export function validateConfig(config: HudConfig): boolean {
  if (!['expanded', 'compact'].includes(config.layout)) return false;
  if (config.display.projectDepth < 1) return false;
  return true;
}

function getConfigPath(): string {
  return path.join(os.homedir(), '.codebuddy', 'plugins', 'codebuddy-hud', 'config.json');
}

export function loadConfig(): HudConfig {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf8');
    const override = JSON.parse(raw);
    return mergeConfig(override);
  } catch {
    return DEFAULT_CONFIG;
  }
}
