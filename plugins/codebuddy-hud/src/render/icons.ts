const ICONS = {
  cost: '💰',
  duration: '⏱️',
  diff: '📝',
  tools: '🔧',
  agents: '🤖',
  tasks: '📋',
} as const;

export type IconName = keyof typeof ICONS;

export function getIcon(name: IconName): string {
  return ICONS[name];
}
// test: valid src change
// test: valid src change for ci verification
// test: valid src change for ci verification
// test: valid src change for ci verification
