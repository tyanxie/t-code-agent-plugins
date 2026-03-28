export const RESET = '\x1b[0m';

const NAMED_COLORS: Record<string, string> = {
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
};

function parseHexColor(hex: string): string {
  const h = hex.replace('#', '');
  let r: number, g: number, b: number;
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
  } else {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  }
  return `\x1b[38;2;${r};${g};${b}m`;
}

function colorCode(color: string | number): string {
  if (typeof color === 'number') {
    return `\x1b[38;5;${color}m`;
  }
  if (color.startsWith('#')) {
    return parseHexColor(color);
  }
  return NAMED_COLORS[color] ?? '';
}

export function colorize(text: string, color: string | number): string {
  const code = colorCode(color);
  if (!code) return text;
  return `${code}${text}${RESET}`;
}

export function dim(text: string): string {
  return `\x1b[2m${text}${RESET}`;
}

export function bold(text: string): string {
  return `\x1b[1m${text}${RESET}`;
}
