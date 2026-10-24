/**
 * 改写历史：~\.dsh\prompt-optimize\history.jsonl，上限 FIFO 淘汰。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
export class History {
    path;
    maxRows;
    constructor(dataDir, maxRows) {
        this.path = dataDir?.startsWith('~')
            ? join(homedir(), dataDir.slice(1), 'history.jsonl')
            : dataDir
                ? join(dataDir, 'history.jsonl')
                : join(homedir(), '.dsh', 'prompt-optimize', 'history.jsonl');
        this.maxRows = Math.max(1, Math.floor(maxRows) || 1);
    }
    append(row) {
        mkdirSync(join(this.path, '..'), { recursive: true });
        const lines = existsSync(this.path) ? readFileSync(this.path, 'utf8').split(/\r?\n/).filter(Boolean) : [];
        lines.push(JSON.stringify(row));
        writeFileSync(this.path, `${lines.slice(-this.maxRows).join('\n')}\n`, 'utf8');
    }
    readAll() {
        if (!existsSync(this.path))
            return [];
        const rows = [];
        for (const line of readFileSync(this.path, 'utf8').split(/\r?\n/)) {
            if (!line.trim())
                continue;
            try {
                rows.push(JSON.parse(line));
            }
            catch {
                // 坏行丢弃
            }
        }
        return rows;
    }
}
//# sourceMappingURL=store.js.map