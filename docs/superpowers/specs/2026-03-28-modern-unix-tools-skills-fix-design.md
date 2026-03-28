# modern-unix-tools Skills 质量修复设计文档

**日期**：2026-03-28  
**版本**：0.1.1（patch 版本，仅修复 skill 文档质量问题）  
**状态**：草稿  
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

**原则**：description 只描述「何时触发加载此 skill」的条件，不描述 skill 的功能或工作方式。关键词仍需保留，用于搜索匹配。

**fd 改写目标**：
- 保留核心触发词：查找文件、file search、fd、find files、文件名/扩展名/类型
- 删除："替代 find 命令"（功能描述）
- 形式：列出具体场景，不总结功能

```yaml
description: >
  当需要按文件名、扩展名或类型查找文件时使用此 skill。
  触发场景：find files、查找文件、文件搜索、fd、
  按文件名/扩展名/类型查找、列出目录下特定文件等。
```

**ripgrep 改写目标**：
- 保留核心触发词：搜索内容、search text、rg、grep、查找函数定义
- 删除："替代 grep 命令"（功能描述）
- 形式：列出具体场景，不总结功能

```yaml
description: >
  当需要在文件内容中搜索文本或正则表达式时使用此 skill。
  触发场景：搜索内容、search text、rg、grep、
  在代码库中查找字符串/正则表达式、查找函数定义等。
```

### F2：精简 fd 组合示例

删除低效写法（`fd -e py | xargs rg "def main"`）及其说明注释，只保留推荐的高效写法：

```bash
# 在所有 Python 文件中搜索特定内容（推荐）
rg -t py "def main"
```

### R2：删除 `-n` 矛盾行

删除 `rg -n "pattern"  # 显示行号（默认已显示）` 整行。该 flag 在默认行为下无实际意义，注释说明已揭示其多余性。

### R3：精简 ripgrep 性能建议

将 4 条精简为 2 条，只保留非显而易见的建议：

**保留**：
- 使用 `-t` 类型标志比 `-g "*.py"` 更高效（非显而易见）
- 使用 `-F` 固定字符串：不需要正则时避免正则解析开销（有实际价值）

**删除**：
- "指定搜索路径比从根目录搜索快"（显而易见的常识）
- "用 `--max-depth` 避免深层遍历"（边缘场景，常识）

---

## 版本号更新

本次修改属于 **patch** 级别（bug 修复，文档质量修正），需将版本从 `0.1.0` 升至 `0.1.1`。

需同步更新以下位置：

1. `plugins/modern-unix-tools/.codebuddy-plugin/plugin.json` — `version` 字段
2. `.codebuddy-plugin/marketplace.json` — modern-unix-tools 的 `version` 字段
3. `README.md` — 插件清单表格中的版本号

---

## 不在本次范围内

- 新增 Common Mistakes 章节（review 发现问题中不包含此项）
- 重构命令速查表结构
- 添加新的命令示例
- 修改 hook 行为或 guard.py
