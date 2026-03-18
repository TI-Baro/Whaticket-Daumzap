import { IConfig } from '../config';
import { Dialect } from '../dialects/Dialect';
import { Builder } from './Builder';
/**
 * @class ModelGenerator
 * @constructor
 * @param {Dialect} dialect
 */
export declare class ModelBuilder extends Builder {
    constructor(config: IConfig, dialect: Dialect);
    /**
     * Build column class member
     * @param {IColumnMetadata} col
     * @param {Dialect} dialect
     */
    private static buildColumnPropertyDecl;
    /**
     * Build association class member
     * @param {IAssociationMetadata} association
     */
    private static buildAssociationPropertyDecl;
    /**
     * Build table class declaration
     * @param {ITableMetadata} tableMetadata
     * @param {Dialect} dialect
     * @param {boolean} strict
     */
    private static buildTableClassDeclaration;
    /**
     * Build main index file
     * @param {ITableMetadata[]} tablesMetadata
     * @returns {string}
     */
    private static buildIndexExports;
    /**
     * Build models files using the given configuration and dialect
     * @returns {Promise<void>}
     */
    build(): Promise<void>;
}
