---
name: codebuddy-hud-configure
description: 当用户要求 "配置 hud"、"修改状态栏"、"configure hud"、"customize hud"、"hud 设置"、"调整 statusline"，或希望自定义 codebuddy-hud 的显示布局、图标风格和可见元素时应使用此 skill。提供交互式配置引导。
---

# codebuddy-hud 配置引导

交互式引导自定义 codebuddy-hud 的配置。按以下步骤依次执行。

## 步骤 1：读取当前配置

读取配置文件 `~/.codebuddy/plugins/codebuddy-hud/config.json`。

- 如果文件存在，展示当前配置内容给用户
- 如果文件不存在，告知用户将使用默认配置，继续引导

## 步骤 2：选择布局模式

引导用户选择：

**布局模式（layout）**，仅支持以下两个值：
- `compact` — 紧凑模式，单行展示核心信息（默认）
- `expanded` — 完整展示，每个元素占据更多空间

## 步骤 3：选择显示/隐藏的元素

引导用户选择要在 statusline 中显示的元素。配置通过 `display` 对象控制，布尔值字段控制元素的显示/隐藏。

| 元素 | 字段名 | 说明 | 默认值 |
|------|--------|------|--------|
| AI 模型 | `model` | 当前使用的 AI 模型名称 | `true` |
| 项目路径 | `project` | 项目名称/路径 | `true` |
| Git 状态 | `git` | Git 分支和状态 | `false` |
| 版本 | `version` | CodeBuddy Code 版本 | `false` |
| 费用 | `cost` | 会话费用 | `false` |
| 时长 | `duration` | 会话时长 | `false` |
| 代码变更 | `diff` | 代码变更统计（+/-行数） | `false` |
| 工具调用 | `tools` | 工具调用统计 | `false` |
| Agent | `agents` | Agent 调用统计 | `false` |
| 任务 | `tasks` | 任务统计 | `false` |
| 上下文进度条 | `contextUsage` | 上下文窗口使用率进度条 | `true` |
| 上下文详细值 | `contextValues` | 进度条旁显示具体 token 数（如 50k/200k） | `false` |

用户可以选择关闭不需要的元素（设为 `false`）。

此外，`projectDepth`（数值，非布尔）控制项目路径显示层级数，默认 `1`（仅显示项目名），最小值为 1。当 `project` 开启时引导用户设置此值。

## 步骤 4：调整颜色和阈值（可选）

询问用户是否需要调整 `colors` 配置：

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `model` | 模型名称颜色 | `"blue"` |
| `project` | 项目路径颜色 | `"green"` |
| `git` | Git 分支颜色 | `"yellow"` |
| `cost` | 费用颜色 | `"cyan"` |
| `costWarning` | 费用警告阈值（美元），超过后变黄 | `0.10` |
| `costCritical` | 费用严重阈值（美元），超过后变红 | `0.50` |
| `contextWarning` | 上下文使用率警告阈值（%），超过后进度条变黄 | `50` |
| `contextCritical` | 上下文使用率严重阈值（%），超过后进度条变红 | `80` |

颜色字段支持三种格式：
- **命名颜色**：`black`、`red`、`green`、`yellow`、`blue`、`magenta`、`cyan`、`white`、`brightBlack`、`brightRed`、`brightGreen`、`brightYellow`、`brightBlue`、`brightMagenta`、`brightCyan`、`brightWhite`
- **256 色**：数字 0-255（如 `208`）
- **HEX**：如 `"#FF5500"`

如果用户不需要调整，跳过此步。

## 步骤 5：调整 Git 显示选项（可选）

询问用户是否需要调整 `git` 配置：

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `dirty` | 是否显示脏状态标记 | `true` |
| `aheadBehind` | 是否显示 ahead/behind 计数 | `false` |

如果用户不需要调整，跳过此步。

## 步骤 6：保存配置

将用户的选择整合为 JSON 配置，保存到 `~/.codebuddy/plugins/codebuddy-hud/config.json`。

只需要写入与默认值不同的配置项，未指定的字段会自动使用默认值。

示例配置（完整结构）：

```json
{
  "layout": "compact",
  "display": {
    "model": true,
    "project": true,
    "projectDepth": 1,
    "git": false,
    "version": false,
    "cost": false,
    "duration": false,
    "diff": false,
    "tools": false,
    "agents": false,
    "tasks": false,
    "contextUsage": true,
    "contextValues": false
  },
  "colors": {
    "model": "blue",
    "project": "green",
    "git": "yellow",
    "cost": "cyan",
    "costWarning": 0.10,
    "costCritical": 0.50,
    "contextWarning": 50,
    "contextCritical": 80
  },
  "git": {
    "dirty": true,
    "aheadBehind": false
  }
}
```

示例（仅覆盖部分配置）：

```json
{
  "layout": "compact",
  "display": {
    "version": true,
    "contextValues": true
  },
  "colors": {
    "costCritical": 1.00
  }
}
```

保存前向用户展示最终配置并确认。如果目录不存在，先创建 `~/.codebuddy/plugins/codebuddy-hud/`。

## 步骤 7：提示生效方式

告知用户：配置已保存，statusline 会自动加载新配置并立即生效，无需重启 CodeBuddy Code。
