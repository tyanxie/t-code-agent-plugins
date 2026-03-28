---
name: ripgrep
description: >
  当需要在文件内容中搜索文本或正则表达式时使用此 skill。
  触发场景：搜索内容、search text、rg、grep、
  在代码库中查找字符串/正则表达式、查找函数定义等。
---

# ripgrep — 现代内容搜索工具

ripgrep（`rg`）是 `grep` 命令的现代替代品，来自 https://github.com/BurntSushi/ripgrep 。
速度极快（比 grep 快 10-100 倍），默认遵守 `.gitignore` 规则，支持完整正则表达式。

## 使用前提

**首先确认 rg 已安装：**

运行 `rg --version`

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
rg -n "pattern"          # 显示行号
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
```

### 输出格式

```bash
rg --json "pattern"      # JSON 格式输出（便于程序处理）
rg -N "pattern"          # 不显示行号
rg --no-heading "pat"    # 不显示文件名分组标题
rg -o "pattern"          # 仅输出匹配的部分
```

## 性能建议

1. **使用 `-t` 类型标志**：`rg -t py "pat"` 比 `-g "*.py"` 更高效
2. **使用 `-F` 固定字符串**：不需要正则时用 `-F`，避免正则解析开销

## grep → rg 常用对照

| grep 写法 | rg 等效写法 |
|-----------|-------------|
| `grep -r "pat" .` | `rg "pat"` |
| `grep -ri "pat" .` | `rg -i "pat"` |
| `grep -rl "pat" .` | `rg -l "pat"` |
| `grep -rn "pat" .` | `rg -n "pat"` |
| `grep -rw "word" .` | `rg -w "word"` |
| `grep --include="*.py" -r "pat"` | `rg -t py "pat"` |
