/**
 * dsh wiring for prompt-optimize：审查/改写工具 + /opt 命令 + 落 history。
 * 与 prompt-vault 分工：vault 管"存与注入"，本插件管"审与改"。
 */
import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "prompt-optimize";
export declare const inject: string[];
export interface Config {
    enabled: boolean;
    dataDir?: string;
    useLLM: boolean;
    maxHistory: number;
    order: number;
}
export declare const Config: Schema<Schemastery.ObjectS<{
    enabled: Schema<boolean, boolean>;
    dataDir: Schema<string, string>;
    useLLM: Schema<boolean, boolean>;
    maxHistory: Schema<number, number>;
    order: Schema<number, number>;
}>, Schemastery.ObjectT<{
    enabled: Schema<boolean, boolean>;
    dataDir: Schema<string, string>;
    useLLM: Schema<boolean, boolean>;
    maxHistory: Schema<number, number>;
    order: Schema<number, number>;
}>>;
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=plugin.d.ts.map