"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Linter = void 0;
const eslint_1 = require("eslint");
const eslintDefaultConfig_1 = require("./eslintDefaultConfig");
/**
 * @class Linter
 */
class Linter {
    constructor(options) {
        if (options) {
            this.engine = new eslint_1.ESLint(options);
        }
        else {
            this.engine = new eslint_1.ESLint({
                baseConfig: eslintDefaultConfig_1.eslintDefaultConfig,
                fix: true,
            });
        }
    }
    async lintFiles(paths) {
        const report = await this.engine.lintFiles(paths);
        await eslint_1.ESLint.outputFixes(report);
    }
}
exports.Linter = Linter;
