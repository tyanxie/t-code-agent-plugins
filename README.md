# t-code-agent-plugins

CodeBuddy Code 插件集。

## 安装

### 添加市场

```bash
/plugin marketplace add tyanxie/t-code-agent-plugins
```

### 安装插件

```bash
/plugin install codebuddy-hud@t-code-agent-plugins
```

## codebuddy-hud

CodeBuddy Code 实时状态栏 HUD，在终端中展示当前会话的关键信息。

### 特性

- **模型/项目/Git 信息展示** — 实时显示当前模型、项目路径、Git 分支状态
- **上下文窗口使用率** — 实时进度条展示上下文窗口占用情况，颜色随使用率变化
- **成本与会话活动追踪** — 展示累计费用、代码变更行数、会话时长等统计数据（gateway 模式下自动隐藏零成本）
- **Expanded/Compact 双布局** — 支持展开和紧凑两种显示模式
- **Emoji 图标** — 使用 emoji 图标，无需安装额外字体
- **全配置化** — 所有显示模块均可通过配置文件自定义

### 依赖

- Node.js >= 18

### 使用

通过 `codebuddy-hud-setup` skill 安装和配置：

```
帮我安装 codebuddy-hud
```

变更配置：

```
帮我配置 codebuddy-hud
```

## modern-unix-tools

用现代 Unix 工具替代传统命令，让 CodeBuddy 在查找文件时自动使用 `fd`，搜索内容时使用 `rg`。

### 特性

- **fd 替代 find** — 更快、更简洁的文件查找，自动遵守 `.gitignore`
- **rg 替代 grep** — 极速内容搜索（比 grep 快 10-100 倍），支持完整正则
- **自动拦截** — 通过 PreToolUse hook 自动拦截 `find`/`grep` Bash 命令，引导改用现代工具
- **工具未安装时自动放行** — 若 fd/rg 未安装，hook 不拦截，不影响工作流

### 依赖

- Python 3（标准库，无额外安装）
- fd（可选，未安装时 find 拦截不生效）：https://github.com/sharkdp/fd
- rg（可选，未安装时 grep 拦截不生效）：https://github.com/BurntSushi/ripgrep

### 使用

安装插件后，Skills 自动可用：

```
/fd          # 加载 fd 使用指南
/ripgrep     # 加载 ripgrep 使用指南
```

Hook 自动生效，无需额外配置。

## 开发

| 修改内容 | 文件位置 |
|----------|----------|
| HUD 核心逻辑 | `plugins/codebuddy-hud/src/`（TypeScript） |
| HUD Skills | `plugins/codebuddy-hud/skills/codebuddy-hud-setup/SKILL.md`、`plugins/codebuddy-hud/skills/codebuddy-hud-configure/SKILL.md` |
| modern-unix-tools Skills | `plugins/modern-unix-tools/skills/fd/SKILL.md`、`plugins/modern-unix-tools/skills/ripgrep/SKILL.md` |
| modern-unix-tools Hook 脚本 | `plugins/modern-unix-tools/scripts/guard.py` |
