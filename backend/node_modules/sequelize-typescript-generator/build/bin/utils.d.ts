import { Dialect } from '../dialects/Dialect';
import { IConfig, TransformCase, TransformMap } from '../config/IConfig';
export type ArgvType = {
    [key: string]: any;
};
export declare const defaultOutputDir = "output-models";
export declare const aliasesMap: {
    HOST: string;
    PORT: string;
    DATABASE: string;
    DIALECT: string;
    SCHEMA: string;
    USERNAME: string;
    PASSWORD: string;
    TABLES: string;
    SKIP_TABLES: string;
    OUTPUT_DIR: string;
    OUTPUT_DIR_CLEAN: string;
    INDICES: string;
    TIMESTAMPS: string;
    CASE: string;
    STORAGE: string;
    LINT_FILE: string;
    SSL: string;
    PROTOCOL: string;
    ASSOCIATIONS_FILE: string;
    ENABLE_SEQUELIZE_LOGS: string;
    DIALECT_OPTIONS: string;
    DIALECT_OPTIONS_FILE: string;
    DISABLE_STRICT: string;
    DISABLE_VIEWS: string;
};
/**
 * Diplay error message and exit
 * @param {string} msg
 * @returns {void}
 */
export declare const error: (msg: string) => void;
/**
 * Parse case argument
 * @param {string} arg
 * @returns { TransformCase | TransformMap }
 */
export declare const parseCase: (arg: string) => TransformCase | TransformMap;
/**
 * Build config object from parsed arguments
 * @param { [key: string]: any } argv
 * Returns {IConfig}
 */
export declare const buildConfig: (argv: ArgvType) => IConfig;
/**
 * Build dialect object from parsed arguments
 * @param { [key: string]: any } argv
 * Returns {Dialect}
 */
export declare const buildDialect: (argv: ArgvType) => Dialect;
/**
 * Validate arguments
 * @param { [key: string]: any } argv
 * @returns {void}
 */
export declare const validateArgs: (argv: ArgvType) => void;
