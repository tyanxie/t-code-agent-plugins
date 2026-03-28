# modern-unix-tools 插件设计文档

**日期**：2026-03-28  
**版本**：0.1.0  
**状态**：已批准

---

## 背景与目标

CodeBuddy Code 在执行文件查找和内容搜索时，默认倾向于使用传统的 `find` 和 `grep` 命令。这两个命令语法繁琐、性能较低，且默认不遵守 `.gitignore` 规则。

`modern-unix-tools` 插件的目标：

- **行为层**：通过 skill 告知 AI 优先使用 `fd`（替代 `find`）和 `rg`（替代 `grep`），并提供完整命令速查
- **拦截层**：通过 PreToolUse hook 自动拦截 Bash 工具调用中的 `find`/`grep` 命令，硬性阻止并引导 AI 改用现代工具

本期（v0.1.0）范围：`fd` + `rg` 两个工具，仅拦截 Bash 工具调用，不拦截 Grep 内置工具。

---

## 目录结构

```
plugins/modern-unix-tools/
├── .codebuddy-plugin/
│   └── plugin.json
├── skills/
│   ├── fd/
│   │   └── SKILL.md
│   └── ripgrep/
│       └── SKILL.md
├── hooks/
│   └── hooks.json
└── scripts/
    └── guard.py
```

---

## 组件设计

### 1. plugin.json

```json
{
  "name": "modern-unix-tools",
  "version": "0.1.0",
  "description": "用现代 Unix 工具替代传统命令：fd 替代 find，rg 替代 grep",
  "author": {
    "name": "tyanxie",
    "url": "https://github.com/tyanxie"
  },
  "repository": "https://github.com/tyanxie/t-code-agent-plugins",
  "keywords": ["fd", "ripgrep", "find", "grep", "modern-unix", "productivity"],
  "category": "工具"
}
```

### 2. skills/fd/SKILL.md

**frontmatter 示例**：

```yaml
---
name: fd
description: >
  当需要查找文件时使用此 skill，替代 find 命令。
  适用场景：查找文件、find files、文件搜索、fd、
  按文件名/扩展名/类型查找、列出目录下特定文件等。
---
```

**内容结构**：

1. 何时使用（替代 find 的所有场景）
2. 何时不用（搜索文件内容用 rg；完整读取文件用 Read 工具）
3. 安装确认：`fd --version`，未安装则提示用户
4. 命令速查表：基础查找、类型过滤、扩展名过滤、排除、执行命令、时间/大小过滤
5. 与 rg 组合使用示例

### 3. skills/ripgrep/SKILL.md

**frontmatter 示例**：

```yaml
---
name: ripgrep
description: >
  当需要在文件内容中搜索文本时使用此 skill，替代 grep 命令。
  适用场景：搜索内容、search text、rg、grep、
  在代码库中查找字符串/正则表达式、查找函数定义等。
---
```

**内容结构**：

1. 何时使用（替代 grep 的所有场景）
2. 何时不用（按文件名查找用 fd；完整读取文件用 Read 工具）
3. 安装确认：`rg --version`，未安装则提示用户
4. 命令速查表：基础搜索、文件类型过滤、上下文显示、正则高级用法、常用组合模式
5. 性能建议：指定路径、使用 `-t` 类型标志、固定字符串 `-F` 等

### 4. hooks/hooks.json

注：`description` 为顶层说明字段，不属于标准 hooks 规范字段，实现时若报错可直接删除。

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"${CODEBUDDY_PLUGIN_ROOT}/scripts/guard.py\""
          }
        ]
      }
    ]
  }
}
```

### 5. scripts/guard.py

**职责**：PreToolUse hook 脚本，检测并拦截 Bash 命令中的 `find`/`grep`

**逻辑流程**：

```
读取 stdin JSON
  → 提取 tool_input.command 字段
  → 检测命令是否含 find（以单词边界匹配）
    → 是：shutil.which('fd') 检测是否安装
      → 已安装：输出 block + reason（提示加载 fd skill）
      → 未安装：放行
  → 检测命令是否含 grep（以单词边界匹配）
    → 是：shutil.which('rg') 检测是否安装
      → 已安装：输出 block + reason（提示加载 ripgrep skill）
      → 未安装：放行
  → 无命中：放行（输出 {} 或不输出）
```

**输出格式**（阻止时）：

```json
{
  "decision": "block",
  "reason": "find 命令已被拦截。请加载 fd skill 并使用 fd 命令替代 find。fd 提供更快的搜索速度和更简洁的语法，且默认遵守 .gitignore 规则。"
}
```

**关键实现细节**：

- `find` 匹配：`re.search(r'\bfind\b', command)`，单词边界避免误匹配 `finder` 等
- `grep` 匹配：`re.search(r'\b(e|f|z)?grep\b', command)`，覆盖 `grep`/`egrep`/`fgrep`/`zgrep`
- fd 安装检测：`shutil.which('fd') or shutil.which('fdfind')`，兼容 Ubuntu/Debian 上的包名 `fdfind`
- 使用纯标准库（`sys`、`json`、`re`、`shutil`），无额外依赖
- 解析异常时静默放行（不影响正常工作流）

---

## 版本更新清单

新增 modern-unix-tools 插件后，需同步更新：

1. `plugins/modern-unix-tools/.codebuddy-plugin/plugin.json` — 新建
2. `.codebuddy-plugin/marketplace.json` — 新增插件条目
3. `README.md` — 插件清单表格新增一行
4. `AGENTS.md` — 更新目录结构

---

## 边界情况说明

| 场景 | 处理方式 |
|------|----------|
| `find`/`grep` 出现在字符串内（如 `echo "find me"`） | 第一期接受一定误判，不做 AST 级解析 |
| `finder`、`grepdb` 等含目标词的其他命令 | 单词边界匹配（`\b`）避免误匹配 |
| `egrep`、`fgrep`、`zgrep` | 正则 `\b(e|f|z)?grep\b` 统一覆盖，均拦截为使用 rg |
| 命令链（如 `ls && grep foo`） | 正常检测，能命中 |
| fd 安装包名为 `fdfind`（Ubuntu/Debian） | 检测逻辑同时尝试 `fd` 和 `fdfind` |
| fd/rg 均未安装 | hook 对两者均放行，不影响用户 |
| python3 不可用 | hook 执行失败，CodeBuddy 默认放行（不影响正常工作流） |
| 同一命令同时含 find 和 grep | 先命中 find 即阻止，提示加载 fd skill |

---

## 不在本期范围内

- 拦截 CodeBuddy 内置 Grep 工具的调用
- 自动将 find/grep 命令转换为等效的 fd/rg 命令
- Windows 支持（guard.py 依赖 Unix 命令检测）
- eza、bat、delta 等其他现代 Unix 工具
