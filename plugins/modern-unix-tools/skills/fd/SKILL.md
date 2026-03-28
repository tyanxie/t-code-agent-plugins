---
name: fd
description: >
  当需要查找文件时使用此 skill，替代 find 命令。
  适用场景：查找文件、find files、文件搜索、fd、
  按文件名/扩展名/类型查找、列出目录下特定文件等。
---

# fd — 现代文件查找工具

fd 是 find 命令的现代替代品，来自 https://github.com/sharkdp/fd，语法更简洁，速度更快，默认遵守 .gitignore 规则。

## 使用前提

先运行 `fd --version` 确认已安装。未安装时：

- **macOS**：`brew install fd`
- **Ubuntu/Debian**：`sudo apt install fd-find`（命令名为 `fdfind`，建议执行 `alias fd=fdfind`）
- **其他平台**：参考 https://github.com/sharkdp/fd#installation

## 何时使用

- 按文件名、扩展名或类型查找文件
- 在指定目录递归搜索
- 所有需要 find 命令的场景

## 何时不用

- 需要搜索文件内容 → 使用 `rg`
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
