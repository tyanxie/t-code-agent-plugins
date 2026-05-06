import type { RenderContext } from '../types.js';
import { getModelName, getProjectPath, getVersion, getSessionId } from '../stdin.js';
import { colorize, dim } from './colors.js';

export function renderIdentityLine(ctx: RenderContext): string | null {
  const { config, stdin, gitStatus, transcript } = ctx;
  const { display, colors } = config;

  const parts: string[] = [];

  if (display.model) {
    const name = getModelName(stdin);
    parts.push(colorize(`[${name}]`, colors.model));
  }

  if (display.project) {
    const project = getProjectPath(stdin, display.projectDepth);
    let segment = colorize(project, colors.project);

    if (display.git && gitStatus) {
      const dirty = gitStatus.isDirty && config.git.dirty ? '*' : '';
      segment += ' ' + colorize(`(${gitStatus.branch}${dirty})`, colors.git);
    }

    parts.push(segment);
  }

  if (display.version) {
    const ver = getVersion(stdin);
    if (ver) {
      parts.push(`v${ver}`);
    }
  }

  if (display.sessionId) {
    const sessionName = transcript?.sessionName;
    if (sessionName) {
      parts.push(colorize(sessionName, 'brightCyan'));
    } else {
      const sid = getSessionId(stdin);
      if (sid) {
        parts.push(dim(`#${sid}`));
      }
    }
  }

  if (parts.length === 0) return null;

  return parts.join(' | ');
}
