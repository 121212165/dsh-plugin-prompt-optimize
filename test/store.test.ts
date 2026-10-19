/** rewrite.ts 与 store.ts：五段骨架重排 + history FIFO。 */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, after } from 'node:test';

import { review } from '../src/rules.ts';
import { rewrite, renderRewrite } from '../src/rewrite.ts';
import { History } from '../src/store.ts';

test('rewrite：坏 prompt → 五段骨架齐全 + 原文保留', () => {
  const bad = '写一份产品介绍，1000 字以内，用表格输出，必须包含三个核心卖点，不要写竞品对比。';
  const result = rewrite(bad, review(bad));
  assert.ok((result.text.match(/# 角色|# 任务|# 约束|# 输出格式/g) ?? []).length >= 4, result.text);
  assert.match(result.text, /1000 字以内/);
  assert.match(result.text, /不要写竞品对比/);
  assert.match(renderRewrite(result, 3), /改写稿/);
});

test('rewrite：好 prompt 仍产出模板（兜底段）', () => {
  const re = rewrite('你是资深译员。翻译下面这段话，保持语气。');
  assert.match(re.text, /# 任务/);
  assert.match(re.text, /不注水/); // 输出格式兜底
});

test('rewrite：空输入', () => {
  assert.deepEqual(rewrite('   '), { text: '', used: [] });
  assert.equal(renderRewrite({ text: '', used: [] }, 0), '空输入：先把要改写的提示词给出来。');
});

const dir = mkdtempSync(join(tmpdir(), 'opt-hist-'));
after(() => rmSync(dir, { recursive: true, force: true }));

test('History：FIFO 淘汰 + 坏行跳过', () => {
  const history = new History(join(dir, 'h1'), 5);
  for (let index = 0; index < 8; index++) history.append({ input: `p${index}`, outputPreview: '', issues: [], at: `2026-10-19T0${index}:00:00Z` });
  const rows = history.readAll();
  assert.deepEqual(rows.map((row) => row.input), ['p3', 'p4', 'p5', 'p6', 'p7']);

  writeFileSync(history.path, `${readFileSync(history.path, 'utf8')}{"broken"}\n`, 'utf8');
  assert.equal(history.readAll().length, 5);
});

test('History：~ 路径展开与默认目录', () => {
  const expanded = new History('~/.dsh/x', 100).path;
  assert.ok(/^[A-Za-z]:[\\/]/.test(expanded));
  assert.ok(expanded.endsWith('history.jsonl'));
  assert.ok(new History(undefined, 100).path.includes('prompt-optimize'));
  assert.equal(new History(undefined, 10).maxRows, 10);
});
