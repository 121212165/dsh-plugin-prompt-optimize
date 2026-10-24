/**
 * 提示词规则引擎（本地、零 token）：8 条规则各自输出 {rule, why, at}。
 * 规则只报问题不改写——改写归 rewrite.ts。
 */
export const RULE_LIST = [
    '缺角色', '缺任务动词', '缺输出格式', '缺边界/约束', '含糊量词', '反向指令堆叠', '无结构长文本', '目标混杂',
];
const TASK_VERBS = /写|改|译|总结|列|评|审|判|析|生成|翻译|检查|对比|修复|实现|重构|给|列出|概括|点评|改写|校对|设计|考虑|建议|回答|解释|完成|回答/u;
const FORMAT_HINT = /格式|输出|结构|表格|JSON|json|markdown|md|列表|分点|条|段|字数|以内|不超过|模板|字段/u;
const VAGUE_Q = /(几个|一些|尽量|适量|大概|可能需要|适当的?[量份条时刻]|若干|很多|不少)[的地]?/u;
const NEG_STACK = /(不要|别|禁止|避免|切忌).{0,40}[。；;.]?\s*(不要|别|禁止|避免|切忌)/gu;
const NO_STRUCTURE = (text) => /^[\s\S]{280,}$/.test(text);
const GOAL_MIX = /(同时|并且|顺带|另外|还要|也请|then|also).{1,80}(再|然后|另一|second|another)/u;
export function review(prompt) {
    const issues = [];
    const text = prompt.trim();
    if (!text) {
        return { issues: [], score: 0, verdict: '空输入：先把要审的提示词给出来。' };
    }
    if (text.length > 8 && !/你是|作为|扮演|请你以|role[:：]/u.test(text.slice(0, 120))) {
        issues.push({ rule: '缺角色', why: '开头 120 字内没有给执行者身份，模型只能按通用默认填空。', at: '开头' });
    }
    const firstSentence = text.split(/[。\n!?！？]/)[0] ?? '';
    if (!TASK_VERBS.test(firstSentence) && !TASK_VERBS.test(text.slice(0, 200))) {
        issues.push({ rule: '缺任务动词', why: '第一句里找不到明确的动作词（写/译/列/评…），任务指向模糊。', at: '首句' });
    }
    if (text.length > 30 && !FORMAT_HINT.test(text)) {
        issues.push({ rule: '缺输出格式', why: '没有约定输出形态（表格/分点/字数/JSON），每个回合格式都会变。', at: '全文' });
    }
    if (text.length > 60 && !/(不要|禁止|避免|以内|不超过|必须|只|仅|范围|边界)/u.test(text)) {
        issues.push({ rule: '缺边界/约束', why: '60+ 字的提示词没有边界与禁区，模型自由发挥面过大。', at: '全文' });
    }
    const vague = VAGUE_Q.exec(text);
    if (vague) {
        issues.push({ rule: '含糊量词', why: `「${vague[0]}」没有数值锚点——给明确范围（如“3 个、≤500 字”）。`, at: `${text.indexOf(vague[0])}` });
    }
    if (NEG_STACK.test(text)) {
        issues.push({ rule: '反向指令堆叠', why: '连续多条“不要…不要…”；正着说该做什么，效果更稳。', at: '全文' });
    }
    if (NO_STRUCTURE(text) && !/[•\-–\d]、|\n\s*[-*\d]/u.test(text)) {
        issues.push({ rule: '无结构长文本', why: '超长单块文本且没有分点/标题，关键约束会被中间内容淹没。', at: '全文' });
    }
    if (GOAL_MIX.test(text)) {
        issues.push({ rule: '目标混杂', why: '一个提示词里塞了多目标任务；拆开按顺序给，或明确主任务与次任务。', at: '全文' });
    }
    NEG_STACK.lastIndex = 0;
    GOAL_MIX.lastIndex = 0;
    const score = Math.max(0, 100 - issues.length * 15);
    return {
        issues,
        score,
        verdict: issues.length ? `命中 ${issues.length} 条（${issues.map((issue) => issue.rule).join('、')}）` : '未命中规则：提示词已是良好形状。',
    };
}
/** 渲染审查结果给人看 */
export function renderReview(text, result) {
    if (!text.trim())
        return result.verdict;
    const lines = [`审查：${result.verdict}（形状分 ${result.score}/100）`];
    result.issues.forEach((issue, index) => lines.push(`  ${index + 1}. [${issue.rule}] ${issue.why}`));
    lines.push(result.issues.length ? '改写跑 /opt rewrite <原文> 或 prompt_rewrite 工具。' : '');
    return lines.filter(Boolean).join('\n');
}
//# sourceMappingURL=rules.js.map