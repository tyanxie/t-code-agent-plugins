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
