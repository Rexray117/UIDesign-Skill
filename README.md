# UI Design Skill · 界面设计（去 AI 味版）

[![DSH Skill](https://img.shields.io/badge/DeepSeek%20Harness-skill-4a7dff)](https://github.com/Rexray117/UIDesign-Skill)
[![version](https://img.shields.io/badge/version-0.1.1-brightgreen)](https://github.com/Rexray117/UIDesign-Skill/releases)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

> 一个 **DeepSeek Harness（DSH）/ Agent Skill**：`UIdesign-v0.1` v0.1.1。

|

## 适用场景

把本仓库整体放进 agent 的技能目录即可按描述自动触发；也可以在对话里直接点名 `UIdesign-v0.1`。

## 目录结构

```
`CHANGELOG.md`
`SKILL.md`
`LICENSE`
`.gitignore`
assets/
data/
references/
scripts/
```

## 安装

### DSH（DeepSeek Harness）

技能目录放到用户级技能根：

```powershell
# Windows
git clone https://github.com/Rexray117/UIDesign-Skill.git "$env:USERPROFILE\.dsh\skills\uidesign-v0.1"
```

```bash
# macOS / Linux
git clone https://github.com/Rexray117/UIDesign-Skill.git ~/.dsh/skills/uidesign-v0.1
```

也可以用 DSH 的插件管理安装本地目录：

```
plugin_manager action=install_bundle target=<本仓库绝对路径>
```

### 其他 agent（Codex / WorkBuddy / Claude Code）

技能根分别位于 `~/.codex/skills`、`~/.workbuddy/skills`、`~/.claude/skills`，把本仓库克隆成其中的 `uidesign-v0.1` 子目录即可（技能名以 `SKILL.md` 的 `name: UIdesign-v0.1` 为准）。

## 版本

- 当前版本：**v0.1.1**（与 `SKILL.md` 的 `version` 字段一致）
- 变更记录见仓库提交历史

## License

MIT © 2026 Rexray117
