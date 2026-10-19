/**
 * 改写：五段式骨架（角色→任务→约束→输出格式→示例留白），保留原文的事实细节。
 * 本地重排（默认），可选 useLLM 走 llm 服务二稿（由 plugin.ts 接线）。
 */

import type { Review } from './rules.ts';

export interface RewriteResult {
  text: string;
  used: string[]; // 迁移进去的原文句子数
}

const ROLE_DEFAULT = '一位对该任务领域熟练的专业执行者';

export function rewrite(prompt: string, review?: Review): RewriteResult {
  const text = prompt.trim();
  if (!text) return { text: '', used: [] };
  const lines = text.split(/[\n；;]+/).map((line) => line.trim()).filter(Boolean);
  // 把原句里明显是"约束/格式/任务"的信号句拾出来，缺省用模板兜底
  const taskLine = lines[0] ?? text;
  const constraintLines = lines.filter((line) => /(不要|禁止|避免|必须|以内|不超过|只用|仅|范围)/u.test(line));
  const formatLines = lines.filter((line) => /(格式|表格|分点|列表|JSON|json|markdown|md|字段|字数)/u.test(line));
  const rest = lines.slice(1).filter((line) => !constraintLines.includes(line) && !formatLines.includes(line));

  const out = [
    `# 角色\n${review?.issues.some((issue) => issue.rule === '缺角色') ? ROLE_DEFAULT : extractRole(text) ?? ROLE_DEFAULT}`,
    `# 任务\n${taskLine}`,
    `# 约束\n- ${constraintLines.length ? constraintLines.join('\n- ') : '只处理上面任务范围内的内容；不确定的信息先确认再动笔。'}`,
    `# 输出格式\n${formatLines.length ? formatLines.join('；') : '分点输出；总长度与信息密度以够用为准，不注水。'}`,
    rest.length ? `# 背景与细节\n${rest.join('\n')}` : '',
    '# 示例\n（可选：贴 1 个理想输出的片段，模型对齐更快）\n',
  ].filter(Boolean);
  return { text: out.join('\n\n'), used: lines.length ? [taskLine, ...constraintLines, ...formatLines].length ? [taskLine] : [] : [] };
}

function extractRole(text: string): string | undefined {
  const match = /你是([^，。\n]{2,20})/u.exec(text);
  return match ? `一位熟悉${match[1]}的执行者`.replace('一位熟悉你是', '一位') : undefined;
}

export function renderRewrite(result: RewriteResult, issues: number): string {
  if (!result.text) return '空输入：先把要改写的提示词给出来。';
  const head = `改写稿（命中 ${issues} 条问题 → 五段式骨架重排，原文细节已保留）：`;
  return `${head}\n\n${result.text}\n\n—— 直接复制使用；不满意可 useLLM=true 让模型二稿润色。`;
}
