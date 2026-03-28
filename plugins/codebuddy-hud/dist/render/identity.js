import { getModelName, getProjectPath, getVersion } from '../stdin.js';
import { colorize } from './colors.js';
export function renderIdentityLine(ctx) {
    const { config, stdin, gitStatus } = ctx;
    const { display, colors } = config;
    const parts = [];
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
    if (parts.length === 0)
        return null;
    return parts.join(' | ');
}
//# sourceMappingURL=identity.js.map