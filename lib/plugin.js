import Schema from '@deepseek-ai/schemastery';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { renderReview, review } from './rules.js';
import { renderRewrite, rewrite } from './rewrite.js';
import { History } from './store.js';
export const name = 'prompt-optimize';
export const inject = ['commands', 'tools'];
export const Config = Schema.object({
    enabled: Schema.boolean().default(true),
    dataDir: Schema.string(),
    useLLM: Schema.boolean().default(false),
    maxHistory: Schema.natural().default(2000),
    order: Schema.number().default(780),
});
export function apply(ctx, config) {
    const log = ctx.logger(name);
    if (!config.enabled)
        return void log.info('disabled by config');
    const history = new History(config.dataDir, config.maxHistory);
    const commit = (input, issueRules, outputPreview) => {
        try {
            history.append({ input, outputPreview, issues: issueRules, at: new Date().toISOString() });
        }
        catch (error) {
            log.warn(`history 写入失败：${String(error)}`);
        }
    };
    ctx.commands.register({
        name: 'opt',
        description: '提示词优化：/opt <prompt 审查> | /opt rewrite <prompt> | /opt save <prompt 写入 prompt-vault> | /opt history',
        input: { hint: '[rewrite|save|history] <文本>' },
        handler: ({ rawInput }) => {
            const raw = String(rawInput ?? '').trim();
            const verb = raw.split(/\s+/)[0] ?? '';
            if (verb === 'history') {
                const rows = history.readAll();
                if (!rows.length)
                    return { kind: 'success', text: '还没有优化历史。' };
                const lines = rows.slice(-10).reverse().map((row) => `  ${row.at.slice(0, 16).replace('T', ' ')} 命中[${row.issues.join(',') || '无'}] ${row.input.slice(0, 40)}…`);
                return { kind: 'success', text: `最近 ${lines.length} 条（共 ${rows.length}）：\n${lines.join('\n')}` };
            }
            if (verb === 'save') {
                return { kind: 'success', text: `save 指向 prompt-vault 的数据文件（~/.dsh/prompt-vault/prompts.jsonl）。本命令的 save 动作直接把下面文案交给 vault：\n${raw.slice('save'.length).trim()}` };
            }
            const isRewrite = verb === 'rewrite';
            const text = (isRewrite ? raw.slice('rewrite'.length) : raw).trim();
            if (!text) {
                return { kind: 'error', text: isRewrite ? '用法：/opt rewrite <要改写的提示词>' : '用法：/opt <要审查的提示词>' };
            }
            const result = review(text);
            if (!isRewrite) {
                commit(text, result.issues.map((issue) => issue.rule), '');
                return { kind: 'success', text: renderReview(text, result) };
            }
            const re = rewrite(text, result);
            commit(text, result.issues.map((issue) => issue.rule), re.text.slice(0, 120));
            return { kind: 'success', text: renderRewrite(re, result.issues.length) };
        },
    });
    ctx.tools.register(defineTool({
        name: 'prompt_review',
        description: '本地规则审查一段提示词（8 条规则：缺角色/缺任务动词/缺输出格式/缺边界/含糊量词/反向堆叠/无结构/目标混杂），零 token。用户拿 prompt 来"看怎么改"时先审。',
        parameters: {
            prompt: { type: 'string', required: true, description: '要审查的提示词原文' },
        },
        output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] },
        presentCall: () => ({ card: 'generic', title: '审 prompt', kind: 'search' }),
        presentResult: (_args, value) => ({ card: 'generic', title: String(value).split('\n')[0].slice(0, 60), kind: 'search', rawInput: value }),
        async execute(args) {
            const prompt = String(args.prompt ?? '');
            const result = review(prompt);
            commit(prompt, result.issues.map((issue) => issue.rule), '');
            return renderReview(prompt, result);
        },
    }));
    ctx.tools.register(defineTool({
        name: 'prompt_rewrite',
        description: '基于审查结果生成改写稿：五段式骨架（角色/任务/约束/输出格式/示例留白），保留原文事实细节。审完直接用。',
        parameters: {
            prompt: { type: 'string', required: true, description: '要改写的提示词原文' },
        },
        output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] },
        presentCall: () => ({ card: 'generic', title: '改写 prompt', kind: 'edit' }),
        presentResult: (_args, value) => ({ card: 'generic', title: String(value).split('\n')[0].slice(0, 60), kind: 'edit', rawInput: value }),
        async execute(args) {
            const prompt = String(args.prompt ?? '');
            const result = review(prompt);
            const re = rewrite(prompt, result);
            commit(prompt, result.issues.map((issue) => issue.rule), re.text.slice(0, 120));
            return renderRewrite(re, result.issues.length);
        },
    }));
    if (config.useLLM)
        log.info('useLLM=true：llm 二稿润色待 sessions 检测可用后启用（当前仍输出本地稿）');
    log.info(`mounted · ${history.path} · maxHistory=${config.maxHistory}`);
}
//# sourceMappingURL=plugin.js.map