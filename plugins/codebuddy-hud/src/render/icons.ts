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
