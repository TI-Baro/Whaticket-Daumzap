import { IConfig } from '../config';
import { Dialect } from '../dialects/Dialect';
/**
 * @class Builder
 * @constructor
 * @param {IConfig} config
 * @param {Dialect} dialect
 */
export declare abstract class Builder {
    private _config;
    private _dialect;
    protected constructor(config: IConfig, dialect: Dialect);
    get config(): IConfig;
    set config(value: IConfig);
    get dialect(): Dialect;
    set dialect(value: Dialect);
    /**
     * Build files with the given configuration and dialect
     * @returns {Promise<void>}
     */
    abstract build(): Promise<void>;
}
