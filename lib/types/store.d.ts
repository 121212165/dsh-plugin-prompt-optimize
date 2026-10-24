/**
 * 改写历史：~\.dsh\prompt-optimize\history.jsonl，上限 FIFO 淘汰。
 */
export interface HistoryRow {
    input: string;
    outputPreview: string;
    issues: string[];
    at: string;
}
export declare class History {
    readonly path: string;
    readonly maxRows: number;
    constructor(dataDir: string | undefined, maxRows: number);
    append(row: HistoryRow): void;
    readAll(): HistoryRow[];
}
//# sourceMappingURL=store.d.ts.map