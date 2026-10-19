# dsh-plugin-prompt-optimize

> **dsh 插件家族**：23 个插件同一目录 **[dsh-plugin-family](https://github.com/121212165/dsh-plugin-family)**。

**EN** — Prompt reviewer/rewriter, zero-token by default: 8 local rules (missing role / task verb / output format / bounds / vague quantifiers / stacked negations / unstructured wall / mixed goals) produce an issue list with a shape score; the rewriter re-shuffles the original text into a 5-section skeleton (role / task / constraints / output format / example slot) preserving its factual details. `/opt`, `prompt_review`, `prompt_rewrite`; history FIFO'd into `~\.dsh\prompt-optimize\history.jsonl`. Handles review & rewrite only — storage/injection belongs to prompt-vault.

**中文** —— 提示词"审与改"：8 条本地正则规则零 token 出问题清单和形状分；改写按"角色 / 任务 / 约束 / 输出格式 / 示例留白"五段骨架重排，原文事实细节保留。`/opt <prompt>` 审查、`/opt rewrite <prompt>` 出改写稿、`/opt history` 看最近记录；`prompt_review` / `prompt_rewrite` 工具供 Agent 判断"这段 prompt 该不该先修再发"。存档与注入归 prompt-vault，本插件不重复存。

## 规则（rules.ts）

1. **缺角色** —— 开头 120 字内没有身份设定
2. **缺任务动词** —— 首句没有明确动作词
3. **缺输出格式** —— 30+ 字无输出形态约定
4. **缺边界/约束** —— 60+ 字无禁区/范围
5. **含糊量词** —— 「一些/尽量/若干」无数值锚点
6. **反向指令堆叠** —— 连续"不要…不要…"（正说更稳）
7. **无结构长文本** —— 280+ 字单块无分点
8. **目标混杂** —— 多目标任务塞一条（拆开）

## 配置

| 字段 | 默认 | 说明 |
|---|---|---|
| `enabled` | `true` | |
| `dataDir` | `~/.dsh/prompt-optimize` | history.jsonl 所在目录 |
| `useLLM` | `false` | llm 二稿润色开关（默认纯本地） |
| `maxHistory` | `2000` | FIFO 上限 |
| `order` | `780` | |

## 限制

- 规则审的是"形状"（角色/动词/格式/约束有无），不判语义对错。
- `useLLM=true` 的二稿润色目前为预留（仍输出本地稿），待 llm 服务接线。
