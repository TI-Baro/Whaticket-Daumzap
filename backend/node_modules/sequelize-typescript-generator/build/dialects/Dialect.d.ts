import { IndexType, IndexMethod, AbstractDataTypeConstructor } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { IConfig } from '../config';
import { IAssociationMetadata } from './AssociationsParser';
export interface ITablesMetadata {
    [tableName: string]: ITableMetadata;
}
export interface ITableMetadata {
    name: string;
    originName: string;
    schema?: 'public' | string;
    timestamps?: boolean;
    columns: {
        [columnName: string]: IColumnMetadata;
    };
    associations?: IAssociationMetadata[];
    comment?: string;
}
export interface IColumnMetadata {
    name: string;
    originName: string;
    type: string;
    typeExt: string;
    dataType?: string;
    primaryKey: boolean;
    foreignKey?: {
        name: string;
        targetModel: string;
    };
    allowNull: boolean;
    autoIncrement: boolean;
    indices?: IIndexMetadata[];
    comment?: string;
    defaultValue?: any;
}
export interface IIndexMetadata {
    name: string;
    type?: IndexType;
    unique?: boolean;
    using?: IndexMethod;
    collation?: string | null;
    seq?: number;
}
export interface ITable {
    name: string;
    comment?: string;
}
type DialectName = 'postgres' | 'mysql' | 'mariadb' | 'sqlite' | 'mssql';
export declare abstract class Dialect {
    /**
     * Accepted dialects
     */
    static dialects: Set<string>;
    /**
     * Dialect name
     */
    name: DialectName;
    /**
     * @constructor
     * @param {DialectName} name
     * @protected
     */
    protected constructor(name: DialectName);
    /**
     * Map database data type to sequelize data type
     * @param {string} dbType
     * @returns {string}
     */
    abstract mapDbTypeToSequelize(dbType: string): AbstractDataTypeConstructor;
    /**
     * Map database data type to javascript data type
     * @param {string} dbType
     * @returns {string
     */
    abstract mapDbTypeToJs(dbType: string): string;
    /**
     * Map database default values to Sequelize type (e.g. uuid() => DataType.UUIDV4).
     * @param {string} v
     * @returns {string}
     */
    abstract mapDefaultValueToSequelize(v: string): string;
    /**
     * Fetch table names for the provided database/schema
     * @param {Sequelize} connection
     * @param {IConfig} config
     * @returns {Promise<string[]>}
     */
    protected abstract fetchTables(connection: Sequelize, config: IConfig): Promise<ITable[]>;
    /**
     * Fetch columns metadata for the provided schema and table
     * @param {Sequelize} connection
     * @param {IConfig} config
     * @param {string} table
     * @returns {Promise<IColumnMetadata[]>}
     */
    protected abstract fetchColumnsMetadata(connection: Sequelize, config: IConfig, table: string): Promise<IColumnMetadata[]>;
    /**
     * Fetch index metadata for the provided table and column
     * @param {Sequelize} connection
     * @param {IConfig} config
     * @param {string} table
     * @param {string} column
     * @returns {Promise<IIndexMetadata[]>}
     */
    protected abstract fetchColumnIndexMetadata(connection: Sequelize, config: IConfig, table: string, column: string): Promise<IIndexMetadata[]>;
    /**
     * Build tables metadata for the specific dialect and schema
     * @param {IConfig} config
     * @returns {Promise<ITableMetadata[]>}
     */
    buildTablesMetadata(config: IConfig): Promise<ITablesMetadata>;
}
export {};
