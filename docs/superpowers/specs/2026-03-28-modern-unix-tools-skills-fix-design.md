# modern-unix-tools Skills 质量修复设计文档

**日期**：2026-03-28  
**版本**：0.1.1（patch 版本，仅修复 skill 文档质量问题）  
**状态**：第二轮审查修正版  
**关联原始 spec**：[2026-03-28-modern-unix-tools-design.md](./2026-03-28-modern-unix-tools-design.md)

---

## 背景

对 `modern-unix-tools` 插件的两个 skills（`fd`、`ripgrep`）进行了 code review，发现以下质量问题。本文档定义修复方案。

---

## 问题清单

### fd/SKILL.md

| # | 问题描述 | 严重程度 |
|---|---------|---------|
| F1 | description 包含 "替代 find 命令" 等功能描述，违反 CSO 规范（应仅描述触发条件） | 高 |
| F2 | 组合示例列出低效写法再紧跟高效写法否定，冗余且误导 | 低 |

### ripgrep/SKILL.md

| # | 问题描述 | 严重程度 |
|---|---------|---------|
| R1 | description 包含 "替代 grep 命令" 等功能描述，违反 CSO 规范 | 高 |
| R2 | `-n` 行的注释 "（默认已显示）" 与列出该命令的行为自相矛盾 | 中 |
| R3 | 性能建议章节 4 条均为常识性内容，token 消耗不合理，可精简 | 低 |

---

## 修复方案

### F1 / R1：description 改写

**CSO 规范说明**：根据 writing-skills 中的 Claude Search Optimization（CSO）标准，skill description 应仅描述「何时触发加载此 skill」的条件，不应总结 skill 的工作流或功能优势。这样可防止 Claude 通过 description 快捷路由，而跳过读取 skill 完整内容。

**修复原则**：
- 删除"替代""功能""优势"等功能描述词语
- 保留核心触发词用于搜索匹配
- 改写为"当用户执行 X 操作时"的纯条件形式

**fd 修复前后对比**：

**修复前**（当前状态，第 3-6 行）：
```yaml
description: >
  当需要查找文件时使用此 skill，替代 find 命令。
  适用场景：查找文件、find files、文件搜索、fd、
  按文件名/扩展名/类型查找、列出目录下特定文件等。
```

**修复后**（CSO 规范遵循）：
```yaml
description: >
  当需要按文件名、扩展名或类型查找文件时使用此 skill。
  触发场景：find files、查找文件、文件搜索、fd、
  按文件名/扩展名/类型查找、列出目录下特定文件等。
```

**ripgrep 修复前后对比**：

**修复前**（当前状态，第 3-6 行）：
```yaml
description: >
  当需要在文件内容中搜索文本时使用此 skill，替代 grep 命令。
  适用场景：搜索内容、search text、rg、grep、
  在代码库中查找字符串/正则表达式、查找函数定义等。
```

**修复后**（CSO 规范遵循）：
```yaml
description: >
  当需要在文件内容中搜索文本或正则表达式时使用此 skill。
  触发场景：搜索内容、search text、rg、grep、
  在代码库中查找字符串/正则表达式、查找函数定义等。
```

---

### F2：精简 fd 组合示例

**修复前**（当前状态，第 80-88 行）：
```bash
### 与 rg 组合

fd -e py | xargs rg "def main"          # 低效写法

# 更高效的写法（直接用 rg 的 -t 标志）
rg -t py "def main"
```

问题：列出低效写法后立即否定，容易误导用户。

**修复后**：
```bash
### 与 rg 组合

# 在所有 Python 文件中搜索特定内容
rg -t py "def main"
```

---

### R2：删除 `-n` 冗余行

**修复前**（当前状态，第 50 行）：
```bash
rg -n "pattern"          # 显示行号（默认已显示）
```

**问题说明**：在 ripgrep 中，`-n` flag 用于显示行号，但行号已是默认行为。加上 `-n` flag 只是显式重申默认行为，无新增功能价值。注释本身已揭示其冗余性。

**修复后**：删除整行（包括注释）。

---

### R3：精简 ripgrep 性能建议

**修复前**（当前状态，第 98-103 行）：
```markdown
## 性能建议

1. **指定搜索路径**：`rg "pat" src/` 比从根目录搜索快得多
2. **使用 `-t` 类型标志**：`rg -t py "pat"` 比 `-g "*.py"` 更高效
3. **使用 `-F` 固定字符串**：不需要正则时用 `-F`，避免正则解析开销
4. **限制搜索深度**：用 `--max-depth` 避免深层遍历
```

**精简标准**：只保留对多数 rg 新手有实际学习价值的建议（性能收益显著且非显而易见）。

**修复后**：
```markdown
## 性能建议

1. **使用 `-t` 类型标志**：`rg -t py "pat"` 比 `-g "*.py"` 更高效
   （CLI 新手常用 `-g` glob 模式，此对比有学习价值）
   
2. **使用 `-F` 固定字符串**：不需要正则时用 `-F`，避免正则解析开销
   （回避无谓的正则解析开销，性能收益显著）
```

**删除理由**：
- "指定搜索路径" — 基础常识，与工具无关，属于一般命令行最佳实践
- "限制搜索深度" — 边缘场景，仅在处理特定深层目录时有实际意义

---

## 版本号更新清单

本次修改属于 **patch** 级别（bug 修复，文档质量修正），需将版本从 `0.1.0` 升至 `0.1.1`。

### 必须更新的文件

1. **插件自身版本号** — `plugins/modern-unix-tools/.codebuddy-plugin/plugin.json`
   - 文件第 3 行：`"version": "0.1.0"` → `"version": "0.1.1"`

2. **Marketplace 版本号** — `.codebuddy-plugin/marketplace.json`
   - modern-unix-tools 条目（第 19 行）：`"version": "0.1.0"` → `"version": "0.1.1"`

### 验证其他位置

执行以下命令确认是否还有其他位置引用 `0.1.0`：
```bash
grep -r "0.1.0" --include="*.json" --include="*.md" .
```

检查结果中是否还有 modern-unix-tools 相关条目，如有则一并更新。

### 不需更新的位置

- **README.md** — 无版本号表格，无需更新
- **AGENTS.md** — 无版本号字段，仅有目录结构说明，无需更新

---

## 已知但不在本次 patch 范围内的优化项

以下是 review 过程中发现但被排除在本次 patch 修复外的改进方向（可作为 minor 版本功能）：

- **新增 Common Mistakes 章节** — 需基于实际用户反馈或测试数据
- **重构命令速查表结构** — 与 token 效率目标冲突，超出 patch 范围
- **添加新的命令示例或高级用法** — 需 UX 验证和实用性评估
- **修改 hook 行为或 guard.py** — 属于功能性变更，需单独的功能测试循环

---

## 实施检查清单

- [ ] 更新 `plugins/modern-unix-tools/.codebuddy-plugin/plugin.json` version 字段
- [ ] 更新 `.codebuddy-plugin/marketplace.json` version 字段
- [ ] 修改 `plugins/modern-unix-tools/skills/fd/SKILL.md` — F1、F2 修复
- [ ] 修改 `plugins/modern-unix-tools/skills/ripgrep/SKILL.md` — R1、R2、R3 修复
- [ ] 执行 grep 验证：`grep -r "0.1.0" --include="*.json" --include="*.md" .`
- [ ] 确保所有版本号更新已完成
- [ ] 运行 pnpm install（如有依赖变更）
