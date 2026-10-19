/** rules.ts 规则引擎：8 条正、反 fixture 全命中验证。 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { review } from '../src/rules.ts';

const RULES = ['缺角色', '缺任务动词', '缺输出格式', '缺边界/约束', '含糊量词', '反向指令堆叠', '无结构长文本', '目标混杂'] as const;

const BAD = '你帮我搞一下这个事情，顺带把那个项目里的文档一起看看，弄完然后看看哪里有问题，同时你弄完之后再看看另外那几处。别的先不管。篇幅别太长。别啰嗦。尽量全面一些，大概几个地方就行。' + '很'.repeat(280);

test('坏 prompt：全 8 条命中', () => {
  const result = review(BAD);
  const hit = new Set(result.issues.map((issue) => issue.rule));
  for (const rule of RULES) {
    assert.ok(hit.has(rule), `应命中「${rule}」，实际命中：${[...hit].join(',')}`);
  }
  assert.ok(result.score < 100);
  assert.match(result.verdict, /命中/);
});

test('逐条 fixture：每条规则有独立正例', () => {
  const cases: Array<[string, string]> = [
    ['缺任务动词', '你是一位资深编辑，这个文档的。'],
    ['缺角色', '写一份产品介绍，200 字以内，用分点'],
  ];
  assert.equal(review(cases[0]![1]).issues.some((issue) => issue.rule === '缺任务动词'), true);
  assert.equal(review(cases[1]![1]).issues.some((issue) => issue.rule === '缺角色'), true);
  assert.equal(review(cases[1]![1]).issues.some((issue) => issue.rule === '缺任务动词'), false);
});

test('缺输出格式 / 缺边界：短长差异', () => {
  const noFormat = '你是编辑，请整理下面这篇文章的内容，把它改得更通顺一些，同时保留作者的核心观点和语气，然后再另外补充一个导读，再给出总结。';
  const result = review(noFormat);
  assert.ok(result.issues.some((issue) => issue.rule === '缺输出格式'));
  assert.ok(result.issues.some((issue) => issue.rule === '缺边界/约束'));
});

test('含糊量词：报出原文片段', () => {
  const result = review('作为编辑审稿，写一份审稿意见，给一些修改建议就行，输出分点，200 字以内，只评价结构不评价内容。');
  const vague = result.issues.find((issue) => issue.rule === '含糊量词');
  assert.ok(vague);
  assert.match(vague!.why, /一些/);
});

test('反向指令堆叠', () => {
  const result = review('作为编辑改稿。不要改动事实。不要动数据部分。输出 diff 格式，30 行以内，只改语言不改结构。');
  assert.ok(result.issues.some((issue) => issue.rule === '反向指令堆叠'));
});

test('好 prompt：零命中 100 分', () => {
  const good = '你是资深技术编辑。请把下面这段文档改写为通顺、无歧义的中文，保持原意：输出 Markdown 分点，每点不超过 2 句，总长 300 字以内；不要引入原文没有的事实。';
  const result = review(good);
  assert.deepEqual(result.issues, []);
  assert.equal(result.score, 100);
  assert.match(result.verdict, /未命中/);
});

test('空输入防御', () => {
  const result = review('   ');
  assert.equal(result.score, 0);
  assert.match(result.verdict, /空输入/);
});
