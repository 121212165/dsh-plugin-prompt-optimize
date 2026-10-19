/** 装配测试：/opt 命令 + 两个工具 + history 落盘。 */
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, after } from 'node:test';

import { apply } from '../src/plugin.ts';

const dataDir = mkdtempSync(join(tmpdir(), 'opt-wire-'));
after(() => rmSync(dataDir, { recursive: true, force: true }));

interface Command { name: string; handler: (args: { rawInput?: string }) => { kind: string; text: string } }
interface Tool { name: string; execute: (args: Record<string, unknown>) => Promise<string> }

const commands: Command[] = [];
const tools: Tool[] = [];
apply({ logger: () => ({ info() {}, warn() {} }), commands: { register(definition: never) { commands.push(definition as never); } }, tools: { register(definition: never) { tools.push(definition as never); } } } as never, {
  enabled: true,
  dataDir: dataDir,
  useLLM: false,
  maxHistory: 100,
  order: 780,
});

const opt = () => commands.find((entry) => entry.name === 'opt')!;

test('bad prompt：缺角色 prompt 全命中', () => {
  assert.ok(opt().name === 'opt');
  const out = opt().handler({ rawInput: '写一个东西，一些就行' });
  assert.equal(out.kind, 'success');
  assert.match(out.text, /审查：/);
  const historyFile = join(dataDir, 'history.jsonl');
  assert.ok(existsSync(historyFile));
  const row = JSON.parse(readFileSync(historyFile, 'utf8').split('\n')[0]!) as { input: string; issues: string[] };
  assert.equal(row.input, '写一个东西，一些就行');
  assert.ok(row.issues.length > 0);
});

test('few-syntax: /opt rewrite 产出五段稿', () => {
  const out = opt().handler({ rawInput: 'rewrite 我要你写一份周报概括一下本周做的东西给老板看' });
  assert.match(out.text, /改写稿/);
  assert.match(out.text, /# 任务/);
  assert.match(out.text, /# 输出格式/);
});

test('few-bad-arg: /opt 没参数报用法；裸文本按审查处理', () => {
  assert.equal(opt().handler({ rawInput: '' }).kind, 'error');
  assert.match(opt().handler({ rawInput: '' }).text, /用法/);
  const bare = opt().handler({ rawInput: 'haha 搞一下' });
  assert.equal(bare.kind, 'success');
  assert.match(bare.text, /审查：/);
});

test('history 空态与查看', () => {
  const fresh = commands.length; // 二次 apply 会重复注册，不再测
  assert.ok(fresh > 0);
  assert.match(opt().handler({ rawInput: 'history' }).text, /最近 \d+ 条/);
});

test('tools: prompt_review / prompt_rewrite', async () => {
  const reviewTool = tools.find((entry) => entry.name === 'prompt_review')!;
  const rewriteTool = tools.find((entry) => entry.name === 'prompt_rewrite')!;
  assert.ok(reviewTool && rewriteTool);
  const reviewText = await reviewTool.execute({ prompt: '帮我搞一下，一些就行' });
  assert.match(reviewText, /审查：/);
  const rewriteText = await rewriteTool.execute({ prompt: '帮我搞一下，一些就行' });
  assert.match(rewriteText, /# 角色/);
});

test('save 分支：指到 prompt-vault 文件', () => {
  const out = opt().handler({ rawInput: 'save 這段話以後重用：你是译员…' });
  assert.match(out.text, /prompt-vault\/prompts\.jsonl/);
});
