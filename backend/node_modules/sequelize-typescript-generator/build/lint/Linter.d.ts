import { ESLint } from 'eslint';
/**
 * @class Linter
 */
export declare class Linter {
    private engine;
    constructor(options?: ESLint.Options);
    lintFiles(paths: string[]): Promise<void>;
}
