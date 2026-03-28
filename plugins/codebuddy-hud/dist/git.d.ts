import type { GitStatus } from './types.js';
export declare function getGitStatus(cwd?: string, options?: {
    aheadBehind?: boolean;
}): Promise<GitStatus | null>;
