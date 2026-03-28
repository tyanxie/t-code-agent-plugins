# modern-unix-tools Skills 质量修复实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 `fd` 和 `ripgrep` 两个 skill 文档中的 5 个质量问题（F1/F2/R1/R2/R3），将插件版本从 0.1.0 升至 0.1.1。

**Architecture:** 纯文档修改，无代码变更。按文件分组：先修改 `fd/SKILL.md`（F1、F2），再修改 `ripgrep/SKILL.md`（R1、R2、R3），最后更新版本号文件。每组修改单独提交。

**Tech Stack:** 文本编辑（Markdown + YAML frontmatter）、Git

**Spec:** `docs/superpowers/specs/2026-03-28-modern-unix-tools-skills-fix-design.md`

---

### Task 1：修复 fd/SKILL.md（F1 + F2）

**Files:**
- Modify: `plugins/modern-unix-tools/skills/fd/SKILL.md:3-6`（F1：description 改写）
- Modify: `plugins/modern-unix-tools/skills/fd/SKILL.md:82-88`（F2：组合示例标注）

- [ ] **步骤 1：修复 F1 — 改写 description（第 3-6 行）**

  将第 3-6 行从：
  ```yaml
  description: >
    当需要查找文件时使用此 skill，替代 find 命令。
    适用场景：查找文件、find files、文件搜索、fd、
    按文件名/扩展名/类型查找、列出目录下特定文件等。
  ```
  改为：
  ```yaml
  description: >
    当需要按文件名、扩展名或类型查找文件时使用此 skill。
    触发场景：find files、查找文件、文件搜索、fd、
    按文件名/扩展名/类型查找、列出目录下特定文件等。
  ```

  核心变更：删除"替代 find 命令"，将"适用场景"改为"触发场景"。

- [ ] **步骤 2：修复 F2 — 为组合示例添加 emoji 标注（第 80-88 行）**

  将 `### 与 rg 组合` 小节（第 80-88 行）的代码块从：
  ```bash
  # 在所有 Python 文件中搜索特定内容
  fd -e py | xargs rg "def main"

  # 更高效的写法（直接用 rg 的 -t 标志）
  rg -t py "def main"
  ```
  改为：
  ```bash
  # ❌ 不推荐：通过 fd + xargs 组合（涉及进程调用）
  fd -e py | xargs rg "def main"

  # ✅ 推荐：直接用 rg 的 -t 标志（更快）
  rg -t py "def main"
  ```

- [ ] **步骤 3：验证文件内容正确**

  读取 `plugins/modern-unix-tools/skills/fd/SKILL.md` 第 1-10 行确认 description 已修改，第 80-90 行确认 emoji 标注已添加。

- [ ] **步骤 4：提交 fd skill 修复**

  ```bash
  git add plugins/modern-unix-tools/skills/fd/SKILL.md
  git commit -m "fix: fd skill — 改写 description 符合 CSO 规范，澄清组合示例（F1+F2）"
  ```

---

### Task 2：修复 ripgrep/SKILL.md（R1 + R2 + R3）

**Files:**
- Modify: `plugins/modern-unix-tools/skills/ripgrep/SKILL.md:3-6`（R1：description 改写）
- Modify: `plugins/modern-unix-tools/skills/ripgrep/SKILL.md:50`（R2：-n 注释改写）
- Modify: `plugins/modern-unix-tools/skills/ripgrep/SKILL.md:98-103`（R3：性能建议精简）

- [ ] **步骤 1：修复 R1 — 改写 description（第 3-6 行）**

  将第 3-6 行从：
  ```yaml
  description: >
    当需要在文件内容中搜索文本时使用此 skill，替代 grep 命令。
    适用场景：搜索内容、search text、rg、grep、
    在代码库中查找字符串/正则表达式、查找函数定义等。
  ```
  改为：
  ```yaml
  description: >
    当需要在文件内容中搜索文本或正则表达式时使用此 skill。
    触发场景：搜索内容、search text、rg、grep、
    在代码库中查找字符串/正则表达式、查找函数定义等。
  ```

  核心变更：删除"替代 grep 命令"，补充"或正则表达式"，将"适用场景"改为"触发场景"。

- [ ] **步骤 2：修复 R2 — 改写 `-n` 行注释（第 50 行）**

  将第 50 行从：
  ```bash
  rg -n "pattern"          # 显示行号（默认已显示）
  ```
  改为：
  ```bash
  rg -n "pattern"          # 显示行号
  ```

  注意：仅删除括号内的"（默认已显示）"，保留其余内容不变。

- [ ] **步骤 3：修复 R3 — 精简性能建议（第 98-103 行）**

  将 `## 性能建议` 整个章节（第 98-103 行，含标题和所有 4 条建议）从 4 条精简为 2 条：

  修复前：
  ```markdown
  ## 性能建议

  1. **指定搜索路径**：`rg "pat" src/` 比从根目录搜索快得多
  2. **使用 `-t` 类型标志**：`rg -t py "pat"` 比 `-g "*.py"` 更高效
  3. **使用 `-F` 固定字符串**：不需要正则时用 `-F`，避免正则解析开销
  4. **限制搜索深度**：用 `--max-depth` 避免深层遍历
  ```

  修复后：
  ```markdown
  ## 性能建议

  1. **使用 `-t` 类型标志**：`rg -t py "pat"` 比 `-g "*.py"` 更高效
  2. **使用 `-F` 固定字符串**：不需要正则时用 `-F`，避免正则解析开销
  ```

  删除第 1 条（"指定搜索路径"）和第 4 条（"限制搜索深度"），并将编号重新排为 1、2。

- [ ] **步骤 4：验证文件内容正确**

  读取 `plugins/modern-unix-tools/skills/ripgrep/SKILL.md`：
  - 第 1-10 行：确认 description 已修改，无"替代 grep 命令"
  - 第 48-52 行：确认 `-n` 注释已改为"显示行号"
  - 第 95-105 行：确认性能建议已精简为 2 条

- [ ] **步骤 5：提交 ripgrep skill 修复**

  ```bash
  git add plugins/modern-unix-tools/skills/ripgrep/SKILL.md
  git commit -m "fix: ripgrep skill — 改写 description，修正 -n 注释，精简性能建议（R1+R2+R3）"
  ```

---

### Task 3：更新版本号至 0.1.1

**Files:**
- Modify: `plugins/modern-unix-tools/.codebuddy-plugin/plugin.json:3`
- Modify: `.codebuddy-plugin/marketplace.json:19`

- [ ] **步骤 1：更新 plugin.json**

  将 `plugins/modern-unix-tools/.codebuddy-plugin/plugin.json` 第 3 行：
  ```json
  "version": "0.1.0",
  ```
  改为：
  ```json
  "version": "0.1.1",
  ```

- [ ] **步骤 2：更新 marketplace.json**

  将 `.codebuddy-plugin/marketplace.json` 中 `modern-unix-tools` 条目（第 19 行）：
  ```json
  "version": "0.1.0",
  ```
  改为：
  ```json
  "version": "0.1.1",
  ```

- [ ] **步骤 3：验证无遗漏版本号**

  执行：
  ```bash
  grep -r "0.1.0" --include="*.json" --include="*.md" .
  ```

  预期：结果中不再出现任何 modern-unix-tools 相关的 `0.1.0`。如有，则继续更新直到全部清零。

- [ ] **步骤 4：提交版本号更新**

  ```bash
  git add plugins/modern-unix-tools/.codebuddy-plugin/plugin.json .codebuddy-plugin/marketplace.json
  git commit -m "chore: modern-unix-tools 升版至 0.1.1（patch — skill 文档质量修复）"
  ```

---

### Task 4：最终验证

- [ ] **步骤 1：读取两个 skill 文件全文，确认所有修复正确**

  读取：
  - `plugins/modern-unix-tools/skills/fd/SKILL.md`
  - `plugins/modern-unix-tools/skills/ripgrep/SKILL.md`

  核查清单：
  - [ ] fd description 不含"替代 find 命令"
  - [ ] fd 组合示例有 ✅/❌ emoji 标注
  - [ ] ripgrep description 不含"替代 grep 命令"
  - [ ] ripgrep 第 50 行注释为"# 显示行号"（无"默认已显示"）
  - [ ] ripgrep 性能建议恰好 2 条

- [ ] **步骤 2：确认 git log 提交历史完整**

  执行：
  ```bash
  git log --oneline -5
  ```

  预期看到 3 条新提交（fd 修复、ripgrep 修复、版本号更新）。

- [ ] **步骤 3：更新 spec 文档状态为"已实施"**

  将 `docs/superpowers/specs/2026-03-28-modern-unix-tools-skills-fix-design.md` 第 5 行：
  ```
  **状态**：第三轮审查修正版
  ```
  改为：
  ```
  **状态**：已实施
  ```

  提交：
  ```bash
  git add docs/superpowers/specs/2026-03-28-modern-unix-tools-skills-fix-design.md
  git commit -m "docs: 更新 skills fix spec 状态为已实施"
  ```
