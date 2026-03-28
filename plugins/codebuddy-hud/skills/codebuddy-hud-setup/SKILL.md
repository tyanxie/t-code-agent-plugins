---
name: codebuddy-hud-setup
description: 当用户要求 "安装 hud"、"设置状态栏"、"setup hud"、"install hud"、"配置 statusline"、"statusline setup"，或希望首次启用 codebuddy-hud statusline 时应使用此 skill。引导完成完整的安装和激活流程。
---

# codebuddy-hud 安装引导

引导完成 codebuddy-hud statusline 的安装和启用。按以下步骤依次执行。

## 步骤 0：检测 Node.js 版本

运行 `node --version` 检查 Node.js 版本，要求 >= 18。

- 如果未安装或版本低于 18，提示用户安装 Node.js 18+，终止流程。
- 如果满足要求，继续下一步。

## 步骤 1：定位插件根目录

**注意：`${CODEBUDDY_PLUGIN_ROOT}` 环境变量在 skill 上下文中不可用（为空），不要尝试通过环境变量获取。**

从本 skill 加载时系统注入的 Base directory 信息推导插件根目录。注入格式为：

```
Base directory for this skill: <路径>/skills/codebuddy-hud-setup
```

去掉末尾的 `/skills/codebuddy-hud-setup` 即为插件根目录（下文称 `<PLUGIN_ROOT>`）。例如：
- Base directory: `/home/user/.codebuddy/plugins/.../codebuddy-hud/skills/codebuddy-hud-setup`
- 插件根目录: `/home/user/.codebuddy/plugins/.../codebuddy-hud`

后续步骤中所有路径均基于 `<PLUGIN_ROOT>`。

## 步骤 2：生成 statusLine 命令

statusLine 命令为：

```
node <PLUGIN_ROOT>/dist/index.js
```

将 `<PLUGIN_ROOT>` 替换为步骤 1 中获取的实际绝对路径。

## 步骤 3：写入 settings.json

读取 `~/.codebuddy/settings.json`（如果文件不存在则创建），添加或更新 `statusLine` 配置项：

```json
{
  "statusLine": {
    "type": "command",
    "command": "node /absolute/path/to/dist/index.js"
  }
}
```

注意事项：
- 保留文件中已有的其他配置项，只添加/更新 `statusLine` 字段
- `command` 中的路径必须是绝对路径
- 如果已存在 `statusLine` 配置，询问用户是否覆盖

## 步骤 4：确认安装

配置写入后 statusline 会自动生效，无需重启 CodeBuddy Code。

告知用户安装已完成，并提示用户查看输入框下方的状态栏区域，确认 HUD 信息是否正常显示。
