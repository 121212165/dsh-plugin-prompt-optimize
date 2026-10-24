/**
 * 提示词规则引擎（本地、零 token）：8 条规则各自输出 {rule, why, at}。
 * 规则只报问题不改写——改写归 rewrite.ts。
 */
export interface Issue {
    rule: string;
    why: string;
    at: string;
}
export interface Review {
    issues: Issue[];
    score: number;
    verdict: string;
}
export declare const RULE_LIST: readonly ['缺角色', '缺任务动词', '缺输出格式', '缺边界/约束', '含糊量词', '反向指令堆叠', '无结构长文本', '目标混杂'];
export type Rule = typeof RULE_LIST[number];
export declare function review(prompt: string): Review;
/** 渲染审查结果给人看 */
export declare function renderReview(text: string, result: Review): string;
//# sourceMappingURL=rules.d.ts.map