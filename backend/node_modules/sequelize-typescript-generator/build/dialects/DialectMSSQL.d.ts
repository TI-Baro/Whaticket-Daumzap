import { AbstractDataTypeConstructor } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { IConfig } from '../config';
import { IColumnMetadata, IIndexMetadata, Dialect, ITable } from './Dialect';
/**
 * Dialect for Postgres
 * @class DialectPostgres
 */
export declare class DialectMSSQL extends Dialect {
    constructor();
    /**
     * Map database data type to sequelize data type
     * @param {string} dbType
     * @returns {string}
     */
    mapDbTypeToSequelize(dbType: string): AbstractDataTypeConstructor;
    /**
     * Map database data type to javascript data type
     * @param {string} dbType
     * @returns {string
     */
    mapDbTypeToJs(dbType: string): string;
    /**
     * Map database default values to Sequelize type (e.g. uuid() => DataType.UUIDV4).
     * @param {string} v
     * @returns {string}
     */
    mapDefaultValueToSequelize(v: string): string;
    /**
     * Fetch table names for the provided database/schema
     * @param {Sequelize} connection
     * @param {IConfig} config
     * @returns {Promise<ITable[]>}
     */
    protected fetchTables(connection: Sequelize, config: IConfig): Promise<ITable[]>;
    /**
     * Fetch columns metadata for the provided schema and table
     * @param {Sequelize} connection
     * @param {IConfig} config
     * @param {string} table
     * @returns {Promise<IColumnMetadata[]>}
     */
    protected fetchColumnsMetadata(connection: Sequelize, config: IConfig, table: string): Promise<IColumnMetadata[]>;
    protected fetchColumnIndexMetadata(connection: Sequelize, config: IConfig, table: string, column: string): Promise<IIndexMetadata[]>;
}
