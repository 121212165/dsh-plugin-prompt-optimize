/**
 * 改写：五段式骨架（角色→任务→约束→输出格式→示例留白），保留原文的事实细节。
 * 本地重排（默认），可选 useLLM 走 llm 服务二稿（由 plugin.ts 接线）。
 */
import type { Review } from './rules.ts';
export interface RewriteResult {
    text: string;
    used: string[];
}
export declare function rewrite(prompt: string, review?: Review): RewriteResult;
export declare function renderRewrite(result: RewriteResult, issues: number): string;
//# sourceMappingURL=rewrite.d.ts.map