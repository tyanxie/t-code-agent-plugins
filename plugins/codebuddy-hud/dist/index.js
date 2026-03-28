import { readStdin } from './stdin.js';
import { parseTranscript } from './transcript.js';
import { getGitStatus } from './git.js';
import { loadConfig } from './config.js';
import { render } from './render/index.js';
async function main() {
    try {
        const stdin = await readStdin();
        if (!stdin) {
            console.log('[codebuddy-hud] Initializing...');
            return;
        }
        const config = loadConfig();
        const transcriptPath = stdin.transcript_path ?? '';
        const transcript = await parseTranscript(transcriptPath);
        const gitStatus = config.display.git
            ? await getGitStatus(stdin.cwd ?? stdin.workspace?.current_dir, {
                aheadBehind: config.git.aheadBehind,
            })
            : null;
        const ctx = { stdin, transcript, gitStatus, config };
        render(ctx);
    }
    catch (error) {
        console.log('[codebuddy-hud] Error:', error instanceof Error ? error.message : 'Unknown');
    }
}
main();
//# sourceMappingURL=index.js.map