# modern-unix-tools 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 `modern-unix-tools` 插件，通过 skill + hook 双机制，让 CodeBuddy 在需要查找文件时自动使用 `fd` 替代 `find`，在搜索内容时使用 `rg` 替代 `grep`。

**Architecture:** 插件包含两个独立 skill（fd、ripgrep）提供命令速查和行为规范；一个 PreToolUse hook 在 Bash 工具调用时自动检测并拦截 find/grep 命令；guard.py 脚本负责实际检测逻辑，使用纯 Python 标准库。

**Tech Stack:** Python 3（标准库：sys、json、re、shutil），Markdown（skill 文档），JSON（plugin.json、hooks.json）

---

## 文件清单

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新建 | `plugins/modern-unix-tools/.codebuddy-plugin/plugin.json` | 插件元数据 |
| 新建 | `plugins/modern-unix-tools/skills/fd/SKILL.md` | fd 使用指南 + 命令速查 |
| 新建 | `plugins/modern-unix-tools/skills/ripgrep/SKILL.md` | rg 使用指南 + 命令速查 |
| 新建 | `plugins/modern-unix-tools/hooks/hooks.json` | PreToolUse hook 配置 |
| 新建 | `plugins/modern-unix-tools/scripts/guard.py` | Bash 命令检测拦截脚本 |
| 修改 | `.codebuddy-plugin/marketplace.json` | 新增 modern-unix-tools 条目 |
| 修改 | `README.md` | 插件清单表格新增一行 |
| 修改 | `AGENTS.md` | 目录结构更新 |

---

## Task 1：搭建插件骨架

**Files:**
- Create: `plugins/modern-unix-tools/.codebuddy-plugin/plugin.json`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p plugins/modern-unix-tools/.codebuddy-plugin
mkdir -p plugins/modern-unix-tools/skills/fd
mkdir -p plugins/modern-unix-tools/skills/ripgrep
mkdir -p plugins/modern-unix-tools/hooks
mkdir -p plugins/modern-unix-tools/scripts
```

- [ ] **Step 2: 创建 plugin.json**

创建 `plugins/modern-unix-tools/.codebuddy-plugin/plugin.json`：

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

- [ ] **Step 3: 提交**

```bash
git add plugins/modern-unix-tools/.codebuddy-plugin/plugin.json
git commit -m "feat(modern-unix-tools): scaffold plugin structure"
```

---

## Task 2：编写 fd skill

**Files:**
- Create: `plugins/modern-unix-tools/skills/fd/SKILL.md`

- [ ] **Step 1: 创建 SKILL.md**

创建 `plugins/modern-unix-tools/skills/fd/SKILL.md`，内容如下：

```markdown
---
name: fd
description: >
  当需要查找文件时使用此 skill，替代 find 命令。
  适用场景：查找文件、find files、文件搜索、fd、
  按文件名/扩展名/类型查找、列出目录下特定文件等。
---

# fd — 现代文件查找工具

fd 是 `find` 命令的现代替代品，来自 https://github.com/sharkdp/fd 。
语法更简洁，速度更快，默认遵守 `.gitignore` 规则。

## 使用前提

**首先确认 fd 已安装：**

```bash
fd --version
```

如果未安装，提示用户安装：
- macOS: `brew install fd`
- Ubuntu/Debian: `sudo apt install fd-find`（命令名为 `fdfind`，建议 `alias fd=fdfind`）
- 其他：参考 https://github.com/sharkdp/fd#installation

## 何时使用

- 按文件名或模式查找文件
- 按扩展名、类型（文件/目录/符号链接）过滤
- 在指定目录下递归搜索
- 对搜索结果批量执行命令
- 所有需要 `find` 命令的场景

## 何时不用

- 需要在文件**内容**中搜索文本 → 使用 `rg`（ripgrep skill）
- 需要完整读取文件内容 → 使用 Read 工具

## 命令速查

### 基础查找

```bash
fd pattern               # 按文件名模式递归查找（自动模糊匹配）
fd pattern /path         # 在指定目录下查找
fd                       # 列出当前目录所有文件（遵守 .gitignore）
fd -H pattern            # 包含隐藏文件（.开头）
fd -I pattern            # 忽略 .gitignore，搜索所有文件
fd -s pattern            # 大小写敏感搜索（默认智能大小写）
```

### 类型过滤

```bash
fd -t f pattern          # 仅查找普通文件（f=file）
fd -t d pattern          # 仅查找目录（d=directory）
fd -t l pattern          # 仅查找符号链接（l=symlink）
fd -t x pattern          # 仅查找可执行文件（x=executable）
```

### 扩展名过滤

```bash
fd -e py                 # 查找所有 .py 文件
fd -e js -e ts           # 查找 .js 和 .ts 文件
fd pattern -e md         # 查找名称匹配且扩展名为 .md 的文件
```

### 排除

```bash
fd -E node_modules       # 排除 node_modules 目录
fd -E "*.log"            # 排除 .log 文件
fd -E dist -E build      # 排除多个目录
```

### 深度与大小

```bash
fd -d 2 pattern          # 最多搜索 2 层深度
fd --size +10m           # 查找大于 10MB 的文件
fd --size -1k            # 查找小于 1KB 的文件
fd --changed-within 1d   # 最近 1 天内修改的文件
fd --changed-before 30d  # 30 天前修改的文件
```

### 对结果执行命令

```bash
fd -e py -x wc -l {}     # 统计每个 .py 文件的行数
fd -e jpg -x convert {} {.}.png   # 批量转换图片格式
fd -t f -e log -x rm {}  # 删除所有 .log 文件
```

占位符说明：
- `{}` — 完整路径
- `{.}` — 去掉扩展名的路径
- `{/}` — 仅文件名
- `{//}` — 仅目录部分

### 与 rg 组合

```bash
# 在所有 Python 文件中搜索特定内容
fd -e py | xargs rg "def main"

# 更高效的写法（直接用 rg 的 -t 标志）
rg -t py "def main"
```

## find → fd 常用对照

| find 写法 | fd 等效写法 |
|-----------|-------------|
| `find . -name "*.py"` | `fd -e py` |
| `find . -type d -name test` | `fd -t d test` |
| `find . -mtime -1` | `fd --changed-within 1d` |
| `find . -size +100M` | `fd --size +100m` |
| `find . -name "*.log" -delete` | `fd -e log -x rm {}` |
```

- [ ] **Step 2: 提交**

```bash
git add plugins/modern-unix-tools/skills/fd/SKILL.md
git commit -m "feat(modern-unix-tools): add fd skill"
```

---

## Task 3：编写 ripgrep skill

**Files:**
- Create: `plugins/modern-unix-tools/skills/ripgrep/SKILL.md`

- [ ] **Step 1: 创建 SKILL.md**

创建 `plugins/modern-unix-tools/skills/ripgrep/SKILL.md`，内容如下：

```markdown
---
name: ripgrep
description: >
  当需要在文件内容中搜索文本时使用此 skill，替代 grep 命令。
  适用场景：搜索内容、search text、rg、grep、
  在代码库中查找字符串/正则表达式、查找函数定义等。
---

# ripgrep — 现代内容搜索工具

ripgrep（`rg`）是 `grep` 命令的现代替代品，来自 https://github.com/BurntSushi/ripgrep 。
速度极快（比 grep 快 10-100 倍），默认遵守 `.gitignore` 规则，支持完整正则表达式。

## 使用前提

**首先确认 rg 已安装：**

```bash
rg --version
```

如果未安装，提示用户安装：
- macOS: `brew install ripgrep`
- Ubuntu/Debian: `sudo apt install ripgrep`
- 其他：参考 https://github.com/BurntSushi/ripgrep#installation

## 何时使用

- 在文件内容中搜索文本或正则表达式
- 查找函数定义、变量引用、字符串出现位置
- 跨多个文件批量搜索
- 所有需要 `grep` 命令的场景

## 何时不用

- 需要按**文件名**查找文件 → 使用 `fd`（fd skill）
- 需要完整读取文件内容 → 使用 Read 工具
- 仅需简单文件名匹配 → 使用 Glob 工具

## 命令速查

### 基础搜索

```bash
rg "pattern"             # 递归搜索当前目录（遵守 .gitignore）
rg "pattern" /path       # 在指定路径搜索
rg -i "pattern"          # 不区分大小写
rg -w "word"             # 仅匹配完整单词
rg -F "literal.string"   # 固定字符串（不解析正则）
rg -l "pattern"          # 仅显示匹配的文件名
rg -c "pattern"          # 显示每个文件的匹配数量
rg -n "pattern"          # 显示行号（默认已显示）
```

### 文件类型过滤

```bash
rg -t py "pattern"       # 仅搜索 Python 文件
rg -t js -t ts "pattern" # 搜索 JS 和 TS 文件
rg -T test "pattern"     # 排除测试文件
rg -g "*.tsx" "pattern"  # 按 glob 模式过滤
rg -g "!dist/**" "pat"   # 排除特定目录
```

### 上下文显示

```bash
rg -C 3 "pattern"        # 显示匹配行前后各 3 行
rg -A 5 "pattern"        # 显示匹配行后 5 行
rg -B 2 "pattern"        # 显示匹配行前 2 行
```

### 搜索范围控制

```bash
rg --hidden "pattern"    # 包含隐藏文件
rg -u "pattern"          # 忽略 .gitignore（-uu 也忽略 .ignore）
rg --max-depth 2 "pat"   # 限制搜索深度
rg -m 10 "pattern"       # 每个文件最多显示 10 个匹配
```

### 正则高级用法

```bash
rg "def \w+\("           # 查找函数定义
rg "^import\s+"          # 查找行首的 import
rg "(TODO|FIXME|HACK):"  # 查找待办注释
rg -U "start.*\nend"     # 跨行匹配（多行模式）
rg "foo" -r "bar"        # 搜索并替换预览（不修改文件）
```

### 输出格式

```bash
rg --json "pattern"      # JSON 格式输出（便于程序处理）
rg -N "pattern"          # 不显示行号
rg --no-heading "pat"    # 不显示文件名分组标题
rg -o "pattern"          # 仅输出匹配的部分
```

## 性能建议

1. **指定搜索路径**：`rg "pat" src/` 比从根目录搜索快得多
2. **使用 `-t` 类型标志**：`rg -t py "pat"` 比 `-g "*.py"` 更高效
3. **使用 `-F` 固定字符串**：不需要正则时用 `-F`，避免正则解析开销
4. **限制搜索深度**：用 `--max-depth` 避免深层遍历

## grep → rg 常用对照

| grep 写法 | rg 等效写法 |
|-----------|-------------|
| `grep -r "pat" .` | `rg "pat"` |
| `grep -ri "pat" .` | `rg -i "pat"` |
| `grep -rl "pat" .` | `rg -l "pat"` |
| `grep -rn "pat" .` | `rg -n "pat"` |
| `grep -rw "word" .` | `rg -w "word"` |
| `grep --include="*.py" -r "pat"` | `rg -t py "pat"` |
```

- [ ] **Step 2: 提交**

```bash
git add plugins/modern-unix-tools/skills/ripgrep/SKILL.md
git commit -m "feat(modern-unix-tools): add ripgrep skill"
```

---

## Task 4：编写 guard.py

**Files:**
- Create: `plugins/modern-unix-tools/scripts/guard.py`

- [ ] **Step 1: 创建 guard.py**

创建 `plugins/modern-unix-tools/scripts/guard.py`：

```python
#!/usr/bin/env python3
"""
guard.py — CodeBuddy Code PreToolUse hook

拦截 Bash 工具调用中的 find/grep 命令，引导使用 fd/rg 替代。
- 若 fd/rg 未安装，对应命令放行（不影响用户正常工作流）
- 解析异常时静默放行
"""

import json
import re
import shutil
import sys


def is_fd_available() -> bool:
    """检测 fd 是否可用，兼容 Ubuntu/Debian 上的 fdfind 包名。"""
    return shutil.which("fd") is not None or shutil.which("fdfind") is not None


def is_rg_available() -> bool:
    """检测 rg 是否可用。"""
    return shutil.which("rg") is not None


def block(reason: str) -> None:
    """输出阻止信号并退出。"""
    print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


def passthrough() -> None:
    """放行，不输出任何内容。"""
    sys.exit(0)


def main() -> None:
    try:
        data = json.loads(sys.stdin.read())
        command = data.get("tool_input", {}).get("command", "")
    except Exception:
        passthrough()
        return

    if not command:
        passthrough()
        return

    # 检测 find（单词边界，避免误匹配 finder 等）
    if re.search(r"\bfind\b", command):
        if is_fd_available():
            block(
                "find 命令已被拦截。请加载 fd skill 并使用 fd 命令替代 find。\n"
                "fd 提供更快的搜索速度和更简洁的语法，且默认遵守 .gitignore 规则。\n"
                "加载方式：在对话中输入 /fd 或告知需要使用 fd skill。"
            )
        else:
            passthrough()
        return

    # 检测 grep 及其变体 egrep/fgrep/zgrep
    if re.search(r"\b(e|f|z)?grep\b", command):
        if is_rg_available():
            block(
                "grep 命令已被拦截。请加载 ripgrep skill 并使用 rg 命令替代 grep。\n"
                "rg 速度比 grep 快 10-100 倍，且默认遵守 .gitignore 规则。\n"
                "加载方式：在对话中输入 /ripgrep 或告知需要使用 ripgrep skill。"
            )
        else:
            passthrough()
        return

    passthrough()


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: 手动验证脚本逻辑**

测试放行场景（无 find/grep）：

```bash
echo '{"tool_input": {"command": "ls -la"}}' | python3 plugins/modern-unix-tools/scripts/guard.py
echo "exit code: $?"
```

预期：无输出，exit code 0

测试 find 检测（需本机已安装 fd）：

```bash
echo '{"tool_input": {"command": "find . -name \"*.py\""}}' | python3 plugins/modern-unix-tools/scripts/guard.py
```

预期：输出 `{"decision": "block", "reason": "find 命令已被拦截..."}` 

测试误匹配防护（finder 不应被拦截）：

```bash
echo '{"tool_input": {"command": "open -a Finder ."}}' | python3 plugins/modern-unix-tools/scripts/guard.py
echo "exit code: $?"
```

预期：无输出，exit code 0

测试 grep 变体：

```bash
echo '{"tool_input": {"command": "egrep \"pattern\" file.txt"}}' | python3 plugins/modern-unix-tools/scripts/guard.py
```

预期（已安装 rg）：输出 block JSON

测试解析异常放行：

```bash
echo 'invalid json' | python3 plugins/modern-unix-tools/scripts/guard.py
echo "exit code: $?"
```

预期：无输出，exit code 0

- [ ] **Step 3: 提交**

```bash
git add plugins/modern-unix-tools/scripts/guard.py
git commit -m "feat(modern-unix-tools): add guard.py hook script"
```

---

## Task 5：配置 hooks.json

**Files:**
- Create: `plugins/modern-unix-tools/hooks/hooks.json`

- [ ] **Step 1: 创建 hooks.json**

创建 `plugins/modern-unix-tools/hooks/hooks.json`：

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

- [ ] **Step 2: 提交**

```bash
git add plugins/modern-unix-tools/hooks/hooks.json
git commit -m "feat(modern-unix-tools): add hooks configuration"
```

---

## Task 6：更新版本号和元数据文件

**Files:**
- Modify: `.codebuddy-plugin/marketplace.json`
- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: 更新 marketplace.json**

在 `.codebuddy-plugin/marketplace.json` 的 `plugins` 数组中新增条目：

```json
{
  "name": "modern-unix-tools",
  "description": "用现代 Unix 工具替代传统命令：fd 替代 find，rg 替代 grep",
  "version": "0.1.0",
  "source": "./plugins/modern-unix-tools"
}
```

- [ ] **Step 2: 更新 README.md**

在 README.md 的开发表格中新增 modern-unix-tools 相关内容，并在文档适当位置新增 `## modern-unix-tools` 章节，简要说明插件功能和使用方式。

- [ ] **Step 3: 更新 AGENTS.md**

在 AGENTS.md 的目录结构中补充 `modern-unix-tools` 插件的目录树，以及在「当前包含插件」列表中新增该插件的简要说明。

- [ ] **Step 4: 提交**

```bash
git add .codebuddy-plugin/marketplace.json README.md AGENTS.md
git commit -m "chore: register modern-unix-tools in marketplace and update docs"
```

---

## 验收标准

完成所有 Task 后，验证以下内容：

- [ ] `plugins/modern-unix-tools/` 目录结构完整，所有文件存在
- [ ] `guard.py` 所有手动测试用例通过（Task 4 Step 2）
- [ ] `marketplace.json` 包含 modern-unix-tools 条目
- [ ] `README.md` 和 `AGENTS.md` 已更新
