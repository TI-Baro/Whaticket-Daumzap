import { AbstractDataTypeConstructor } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { IConfig } from '../config';
import { IColumnMetadata, Dialect, IIndexMetadata, ITable } from './Dialect';
/**
 * Dialect for SQLite
 * @class DialectSQLite
 */
export declare class DialectSQLite extends Dialect {
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
    protected fetchColumnsMetadata(connection: Sequelize, config: IConfig, table: string): Promise<IColumnMetadata[]>;
    protected fetchColumnIndexMetadata(connection: Sequelize, config: IConfig, table: string, column: string): Promise<IIndexMetadata[]>;
}
