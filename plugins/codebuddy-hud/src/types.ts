export interface StdinData {
  hook_event_name?: string;
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  model?: {
    id?: string;
    display_name?: string;
  };
  workspace?: {
    current_dir?: string;
    project_dir?: string;
  };
  version?: string;
  output_style?: {
    name?: string;
  };
  cost?: {
    total_cost_usd?: number;
    total_duration_ms?: number;
    total_api_duration_ms?: number;
    total_lines_added?: number;
    total_lines_removed?: number;
  };
  context_window?: {
    total_input_tokens?: number;
    total_output_tokens?: number;
    context_window_size?: number;
    current_usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
    used_percentage?: number;
    remaining_percentage?: number;
  };
  exceeds_200k_tokens?: boolean;
}

export interface ToolEntry {
  id: string;
  name: string;
  target?: string;
  status: 'running' | 'completed' | 'error';
  startTime: Date;
  endTime?: Date;
}

export interface AgentEntry {
  id: string;
  type: string;
  model?: string;
  description?: string;
  status: 'running' | 'completed';
  startTime: Date;
  endTime?: Date;
}

export interface TaskItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface TranscriptData {
  tools: ToolEntry[];
  agents: AgentEntry[];
  tasks: TaskItem[];
  sessionStart?: Date;
  sessionName?: string;
}

export interface GitStatus {
  branch: string;
  isDirty: boolean;
  ahead: number;
  behind: number;
}

export interface HudConfig {
  layout: 'expanded' | 'compact';
  display: {
    model: boolean;
    project: boolean;
    projectDepth: number;
    git: boolean;
    version: boolean;
    cost: boolean;
    duration: boolean;
    diff: boolean;
    tools: boolean;
    agents: boolean;
    tasks: boolean;
    contextUsage: boolean;
    contextValues: boolean;
  };
  colors: {
    model: string;
    project: string;
    git: string;
    cost: string;
    costWarning: number;
    costCritical: number;
    contextWarning: number;
    contextCritical: number;
  };
  git: {
    dirty: boolean;
    aheadBehind: boolean;
  };
}

export interface RenderContext {
  stdin: StdinData;
  transcript: TranscriptData;
  gitStatus: GitStatus | null;
  config: HudConfig;
}
