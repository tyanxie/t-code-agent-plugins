import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { createHash } from 'node:crypto';
import * as os from 'node:os';
const CACHE_DIR = path.join(os.homedir(), '.codebuddy', 'plugins', 'codebuddy-hud', 'transcript-cache');
function getCachePath(transcriptPath) {
    const hash = createHash('sha256').update(path.resolve(transcriptPath)).digest('hex');
    return path.join(CACHE_DIR, `${hash}.json`);
}
function getFileState(filePath) {
    try {
        const stat = fs.statSync(filePath);
        if (!stat.isFile())
            return null;
        return { mtimeMs: stat.mtimeMs, size: stat.size };
    }
    catch {
        return null;
    }
}
function readCache(transcriptPath, state) {
    try {
        const raw = fs.readFileSync(getCachePath(transcriptPath), 'utf8');
        const cached = JSON.parse(raw);
        if (cached.transcriptPath !== path.resolve(transcriptPath) ||
            cached.state.mtimeMs !== state.mtimeMs ||
            cached.state.size !== state.size) {
            return null;
        }
        return {
            tools: cached.data.tools.map(t => ({
                ...t,
                startTime: new Date(t.startTime),
                endTime: t.endTime ? new Date(t.endTime) : undefined,
            })),
            agents: cached.data.agents.map(a => ({
                ...a,
                startTime: new Date(a.startTime),
                endTime: a.endTime ? new Date(a.endTime) : undefined,
            })),
            tasks: cached.data.tasks,
            sessionStart: cached.data.sessionStart ? new Date(cached.data.sessionStart) : undefined,
        };
    }
    catch {
        return null;
    }
}
function writeCache(transcriptPath, state, data) {
    try {
        fs.mkdirSync(path.dirname(getCachePath(transcriptPath)), { recursive: true });
        const payload = {
            transcriptPath: path.resolve(transcriptPath),
            state,
            data: {
                tools: data.tools.map(t => ({
                    ...t,
                    startTime: t.startTime.toISOString(),
                    endTime: t.endTime?.toISOString(),
                })),
                agents: data.agents.map(a => ({
                    ...a,
                    startTime: a.startTime.toISOString(),
                    endTime: a.endTime?.toISOString(),
                })),
                tasks: data.tasks,
                sessionStart: data.sessionStart?.toISOString(),
            },
        };
        fs.writeFileSync(getCachePath(transcriptPath), JSON.stringify(payload), 'utf8');
    }
    catch {
        // Cache write failure is non-fatal
    }
}
function extractTarget(toolName, input) {
    if (!input)
        return undefined;
    switch (toolName) {
        case 'Read':
        case 'Write':
        case 'Edit':
            return input.file_path ?? input.path;
        case 'Glob':
        case 'Grep':
            return input.pattern;
        case 'Bash': {
            const cmd = input.command;
            return cmd ? cmd.slice(0, 30) + (cmd.length > 30 ? '...' : '') : undefined;
        }
    }
    return undefined;
}
function normalizeTaskStatus(status) {
    if (typeof status !== 'string')
        return null;
    switch (status) {
        case 'pending':
        case 'not_started':
            return 'pending';
        case 'in_progress':
        case 'running':
            return 'in_progress';
        case 'completed':
        case 'complete':
        case 'done':
            return 'completed';
        default:
            return null;
    }
}
export async function parseTranscript(transcriptPath) {
    const empty = { tools: [], agents: [], tasks: [] };
    if (!transcriptPath || !fs.existsSync(transcriptPath)) {
        return empty;
    }
    const fileState = getFileState(transcriptPath);
    if (!fileState)
        return empty;
    const cached = readCache(transcriptPath, fileState);
    if (cached)
        return cached;
    const toolMap = new Map();
    const agentMap = new Map();
    const tasks = [];
    const taskIdToIndex = new Map();
    let sessionStart;
    let sessionName;
    let parsedCleanly = false;
    try {
        const rl = readline.createInterface({
            input: fs.createReadStream(transcriptPath),
            crlfDelay: Infinity,
        });
        for await (const line of rl) {
            if (!line.trim())
                continue;
            try {
                const entry = JSON.parse(line);
                const timestamp = entry.timestamp ? new Date(entry.timestamp) : new Date();
                if (!sessionStart && entry.timestamp) {
                    sessionStart = timestamp;
                }
                // 提取 /rename 或 AI 自动生成的会话名称（取最新的）
                if (entry.type === 'ai-title' && typeof entry.aiTitle === 'string' && entry.aiTitle) {
                    sessionName = entry.aiTitle;
                }
                if (entry.type === 'custom-title' && typeof entry.customTitle === 'string' && entry.customTitle) {
                    sessionName = entry.customTitle;
                }
                // CodeBuddy Code format: top-level function_call / function_call_result entries
                if (entry.type === 'function_call' && entry.callId && entry.name) {
                    const input = entry.arguments ? (() => { try { return JSON.parse(entry.arguments); } catch { return undefined; } })() : undefined;
                    if (entry.name === 'Task') {
                        agentMap.set(entry.callId, {
                            id: entry.callId,
                            type: input?.subagent_type ?? 'unknown',
                            model: input?.model ?? undefined,
                            description: input?.description ?? undefined,
                            status: 'running',
                            startTime: timestamp,
                        });
                    }
                    else if (entry.name === 'TaskCreate') {
                        const subject = typeof input?.subject === 'string' ? input.subject : '';
                        const description = typeof input?.description === 'string' ? input.description : '';
                        const taskContent = subject || description || 'Untitled task';
                        const status = normalizeTaskStatus(input?.status) ?? 'pending';
                        tasks.push({ content: taskContent, status });
                        const taskId = typeof input?.taskId === 'string' || typeof input?.taskId === 'number'
                            ? String(input.taskId)
                            : entry.callId;
                        if (taskId) {
                            taskIdToIndex.set(taskId, tasks.length - 1);
                        }
                    }
                    else if (entry.name === 'TaskUpdate') {
                        const taskId = typeof input?.taskId === 'string' || typeof input?.taskId === 'number'
                            ? String(input.taskId)
                            : undefined;
                        if (taskId) {
                            let index = taskIdToIndex.get(taskId);
                            if (index === undefined && /^\d+$/.test(taskId)) {
                                const numIdx = parseInt(taskId, 10) - 1;
                                if (numIdx >= 0 && numIdx < tasks.length)
                                    index = numIdx;
                            }
                            if (index !== undefined) {
                                const newStatus = normalizeTaskStatus(input?.status);
                                if (newStatus)
                                    tasks[index].status = newStatus;
                                const newSubject = typeof input?.subject === 'string' ? input.subject : '';
                                const newDesc = typeof input?.description === 'string' ? input.description : '';
                                const newContent = newSubject || newDesc;
                                if (newContent)
                                    tasks[index].content = newContent;
                            }
                        }
                    }
                    else {
                        toolMap.set(entry.callId, {
                            id: entry.callId,
                            name: entry.name,
                            target: extractTarget(entry.name, input),
                            status: 'running',
                            startTime: timestamp,
                        });
                    }
                    continue;
                }
                if (entry.type === 'function_call_result' && entry.callId) {
                    const tool = toolMap.get(entry.callId);
                    if (tool) {
                        tool.status = entry.isError ? 'error' : 'completed';
                        tool.endTime = timestamp;
                    }
                    const agent = agentMap.get(entry.callId);
                    if (agent) {
                        agent.status = 'completed';
                        agent.endTime = timestamp;
                    }
                    continue;
                }
                const content = entry.message?.content;
                if (!content || !Array.isArray(content))
                    continue;
                for (const block of content) {
                    if (block.type === 'tool_use' && block.id && block.name) {
                        if (block.name === 'Task') {
                            const input = block.input;
                            agentMap.set(block.id, {
                                id: block.id,
                                type: input?.subagent_type ?? 'unknown',
                                model: input?.model ?? undefined,
                                description: input?.description ?? undefined,
                                status: 'running',
                                startTime: timestamp,
                            });
                        }
                        else if (block.name === 'TaskCreate') {
                            const input = block.input;
                            const subject = typeof input?.subject === 'string' ? input.subject : '';
                            const description = typeof input?.description === 'string' ? input.description : '';
                            const taskContent = subject || description || 'Untitled task';
                            const status = normalizeTaskStatus(input?.status) ?? 'pending';
                            tasks.push({ content: taskContent, status });
                            const taskId = typeof input?.taskId === 'string' || typeof input?.taskId === 'number'
                                ? String(input.taskId)
                                : block.id;
                            if (taskId) {
                                taskIdToIndex.set(taskId, tasks.length - 1);
                            }
                        }
                        else if (block.name === 'TaskUpdate') {
                            const input = block.input;
                            const taskId = typeof input?.taskId === 'string' || typeof input?.taskId === 'number'
                                ? String(input.taskId)
                                : undefined;
                            if (taskId) {
                                let index = taskIdToIndex.get(taskId);
                                if (index === undefined && /^\d+$/.test(taskId)) {
                                    const numIdx = parseInt(taskId, 10) - 1;
                                    if (numIdx >= 0 && numIdx < tasks.length)
                                        index = numIdx;
                                }
                                if (index !== undefined) {
                                    const newStatus = normalizeTaskStatus(input?.status);
                                    if (newStatus)
                                        tasks[index].status = newStatus;
                                    const newSubject = typeof input?.subject === 'string' ? input.subject : '';
                                    const newDesc = typeof input?.description === 'string' ? input.description : '';
                                    const newContent = newSubject || newDesc;
                                    if (newContent)
                                        tasks[index].content = newContent;
                                }
                            }
                        }
                        else {
                            toolMap.set(block.id, {
                                id: block.id,
                                name: block.name,
                                target: extractTarget(block.name, block.input),
                                status: 'running',
                                startTime: timestamp,
                            });
                        }
                    }
                    if (block.type === 'tool_result' && block.tool_use_id) {
                        const tool = toolMap.get(block.tool_use_id);
                        if (tool) {
                            tool.status = block.is_error ? 'error' : 'completed';
                            tool.endTime = timestamp;
                        }
                        const agent = agentMap.get(block.tool_use_id);
                        if (agent) {
                            agent.status = 'completed';
                            agent.endTime = timestamp;
                        }
                    }
                }
            }
            catch {
                // Skip malformed lines
            }
        }
        parsedCleanly = true;
    }
    catch {
        // Return partial results on error
    }
    const result = {
        tools: Array.from(toolMap.values()).slice(-20),
        agents: Array.from(agentMap.values()).slice(-10),
        tasks,
        sessionStart,
        sessionName,
    };
    if (parsedCleanly) {
        writeCache(transcriptPath, fileState, result);
    }
    return result;
}
//# sourceMappingURL=transcript.js.map