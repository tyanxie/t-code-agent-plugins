# AGENTS.md

## 项目概要

t-code-agent-plugins — CodeBuddy Code 插件集，仓库地址 https://github.com/tyanxie/t-code-agent-plugins 。

当前包含一个插件：
- **codebuddy-hud**：CodeBuddy Code 实时状态栏 HUD

## 目录结构

```
t-code-agent-plugins/
├── .codebuddy-plugin/
│   └── marketplace.json
├── README.md
├── AGENTS.md
└── plugins/
    └── codebuddy-hud/
        ├── .codebuddy-plugin/
        │   └── plugin.json
        ├── src/
        │   ├── index.ts
        │   ├── types.ts
        │   ├── stdin.ts
        │   ├── git.ts
        │   ├── transcript.ts
        │   ├── config.ts
        │   ├── render/
        │   │   ├── index.ts
        │   │   ├── identity.ts
        │   │   ├── stats.ts
        │   │   ├── activity.ts
        │   │   ├── icons.ts
        │   │   ├── colors.ts
        │   │   └── width.ts
        │   └── utils/
        │       └── format.ts
        ├── skills/
        │   ├── codebuddy-hud-setup/SKILL.md
        │   └── codebuddy-hud-configure/SKILL.md
        ├── tests/
        ├── package.json
        ├── tsconfig.json
        └── pnpm-lock.yaml
```

## 版本号规则

**所有插件**在每次修改后必须更新版本号，遵循 [semver](https://semver.org/) 规范：

- **patch**（第三位）：bug 修复、文档修正、边界场景补全等不影响功能的变更
- **minor**（第二位）：新增功能、新增 skill/agent、行为变更等向后兼容的变更
- **major**（第一位）：破坏性变更、删除功能、不兼容的接口变更

**更新版本号时必须检查并同步所有涉及版本号的位置**：

1. `<插件名>/.codebuddy-plugin/plugin.json` — 插件自身的 version 字段
2. `.codebuddy-plugin/marketplace.json` — marketplace 中该插件的 version 字段
3. `README.md` — 插件清单表格中的版本号
4. 其他任何可能引用版本号的文件（用 grep 搜索确认）

版本号更新应与功能修改在同一次提交中完成。

## codebuddy-hud 插件设计背景

### 要解决的问题

在 CodeBuddy Code 会话中，用户缺乏对当前会话状态的直观感知——不知道用的什么模型、花了多少钱、改了多少代码、上下文窗口用了多少。需要一个实时状态栏来展示这些关键信息。

### 架构：模块化渲染管线

```
数据层（stdin/transcript/git） → 配置层（config） → 渲染层（identity/stats/activity）
```

- **数据层**：从 stdin 读取 CodeBuddy 注入的 JSON（模型、工作区、成本、上下文窗口使用率等），从 transcript 解析会话记录，从 git 获取仓库状态
- **配置层**：读取用户配置文件，控制布局模式（expanded/compact）和各模块开关
- **渲染层**：将数据渲染为终端 ANSI 彩色输出，分为 identity（模型/项目）、stats（成本/代码量）、activity（会话活动）三个渲染模块

### 组件职责

| 模块 | 文件 | 职责 |
|------|------|------|
| 类型定义 | `src/types.ts` | 所有数据结构的 TypeScript 类型 |
| 标准输入解析 | `src/stdin.ts` | 解析 CodeBuddy 通过 stdin 注入的 JSON 数据 |
| Git 状态 | `src/git.ts` | 获取 Git 分支、dirty 状态等 |
| 会话记录 | `src/transcript.ts` | 解析 transcript JSONL 提取会话活动 |
| 配置管理 | `src/config.ts` | 读取和合并用户配置 |
| 身份渲染 | `src/render/identity.ts` | 渲染模型名、项目路径、Git 分支 |
| 统计渲染 | `src/render/stats.ts` | 渲染上下文使用率进度条、成本、代码变更行数、会话时长 |
| 活动渲染 | `src/render/activity.ts` | 渲染最近的会话活动摘要 |
| 图标 | `src/render/icons.ts` | Nerd Font 图标映射 |
| 颜色 | `src/render/colors.ts` | ANSI 颜色常量 |
| 宽度计算 | `src/render/width.ts` | Unicode 字符宽度计算 |
| 格式化工具 | `src/utils/format.ts` | 数字、时长、路径等格式化 |

### Skills

- **codebuddy-hud-setup**：安装引导，帮助用户配置 Hook 和生成初始配置文件
- **codebuddy-hud-configure**：配置管理，调整布局模式、模块开关、图标风格等

Skills 仅提供文档指导，不直接执行安装操作。

### 技术选型

- **TypeScript + Node.js**：类型安全，编译为 JS 后由 Node.js 运行
- **零运行时依赖**：仅使用 Node.js 内置模块，无第三方运行时依赖
- **pnpm**：包管理器，仅管理开发依赖（@types/node、typescript）

### 设计决策

1. 纯 stdin/stdout 架构：通过 stdin 接收数据，stdout 输出渲染结果，无文件 I/O 副作用
2. 所有渲染模块可独立开关，通过配置文件控制
3. 使用 emoji 图标，无需安装额外字体
4. 使用 pnpm 而非 npm，与项目级包管理保持一致
