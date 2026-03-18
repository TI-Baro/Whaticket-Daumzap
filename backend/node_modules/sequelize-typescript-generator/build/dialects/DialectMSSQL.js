"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialectMSSQL = void 0;
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const Dialect_1 = require("./Dialect");
const utils_1 = require("./utils");
const jsDataTypesMap = {
    int: 'number',
    bigint: 'string',
    tinyint: 'number',
    smallint: 'number',
    numeric: 'number',
    decimal: 'number',
    float: 'number',
    real: 'number',
    money: 'number',
    smallmoney: 'number',
    char: 'string',
    nchar: 'string',
    varchar: 'string',
    nvarchar: 'string',
    text: 'string',
    ntext: 'string',
    date: 'string',
    datetime: 'Date',
    datetime2: 'Date',
    timestamp: 'Date',
    datetimeoffset: 'Date',
    time: 'Date',
    smalldatetime: 'string',
    bit: 'boolean',
    binary: 'Uint8Array',
    varbinary: 'Uint8Array',
    uniqueidentifier: 'string',
    xml: 'string',
    geography: 'object',
};
const sequelizeDataTypesMap = {
    int: sequelize_typescript_1.DataType.INTEGER,
    bigint: sequelize_typescript_1.DataType.BIGINT,
    tinyint: sequelize_typescript_1.DataType.INTEGER,
    smallint: sequelize_typescript_1.DataType.INTEGER,
    numeric: sequelize_typescript_1.DataType.DECIMAL,
    decimal: sequelize_typescript_1.DataType.DECIMAL,
    float: sequelize_typescript_1.DataType.FLOAT,
    real: sequelize_typescript_1.DataType.REAL,
    money: sequelize_typescript_1.DataType.STRING,
    smallmoney: sequelize_typescript_1.DataType.STRING,
    char: sequelize_typescript_1.DataType.STRING,
    nchar: sequelize_typescript_1.DataType.STRING,
    varchar: sequelize_typescript_1.DataType.STRING,
    nvarchar: sequelize_typescript_1.DataType.STRING,
    text: sequelize_typescript_1.DataType.STRING,
    ntext: sequelize_typescript_1.DataType.STRING,
    date: sequelize_typescript_1.DataType.DATEONLY,
    datetime: sequelize_typescript_1.DataType.DATE,
    datetime2: sequelize_typescript_1.DataType.DATE,
    timestamp: sequelize_typescript_1.DataType.DATE,
    datetimeoffset: sequelize_typescript_1.DataType.STRING,
    time: sequelize_typescript_1.DataType.TIME,
    smalldatetime: sequelize_typescript_1.DataType.DATE,
    bit: sequelize_typescript_1.DataType.STRING,
    binary: sequelize_typescript_1.DataType.STRING,
    varbinary: sequelize_typescript_1.DataType.STRING,
    uniqueidentifier: sequelize_typescript_1.DataType.STRING,
    xml: sequelize_typescript_1.DataType.STRING,
    geography: sequelize_typescript_1.DataType.GEOGRAPHY,
};
/**
 * Dialect for Postgres
 * @class DialectPostgres
 */
class DialectMSSQL extends Dialect_1.Dialect {
    constructor() {
        super('mssql');
    }
    /**
     * Map database data type to sequelize data type
     * @param {string} dbType
     * @returns {string}
     */
    mapDbTypeToSequelize(dbType) {
        return sequelizeDataTypesMap[dbType];
    }
    /**
     * Map database data type to javascript data type
     * @param {string} dbType
     * @returns {string
     */
    mapDbTypeToJs(dbType) {
        return jsDataTypesMap[dbType];
    }
    /**
     * Map database default values to Sequelize type (e.g. uuid() => DataType.UUIDV4).
     * @param {string} v
     * @returns {string}
     */
    mapDefaultValueToSequelize(v) {
        return v;
    }
    /**
     * Fetch table names for the provided database/schema
     * @param {Sequelize} connection
     * @param {IConfig} config
     * @returns {Promise<ITable[]>}
     */
    async fetchTables(connection, config) {
        const query = `
            SELECT
                t.name               AS [table_name],
                td.value             AS [table_comment]
            FROM sysobjects t
            INNER JOIN sysusers u
                ON u.uid = t.uid
            LEFT OUTER JOIN sys.extended_properties td
                ON td.major_id = t.id AND td.minor_id = 0 AND td.name = 'MS_Description'
            WHERE t.type = 'u';
        `;
        const tables = (await connection.query(query, {
            type: sequelize_1.QueryTypes.SELECT,
            raw: true,
        })).map(({ table_name, table_comment }) => {
            const t = {
                name: table_name,
                comment: table_comment !== null && table_comment !== void 0 ? table_comment : undefined,
            };
            return t;
        });
        return tables;
    }
    /**
     * Fetch columns metadata for the provided schema and table
     * @param {Sequelize} connection
     * @param {IConfig} config
     * @param {string} table
     * @returns {Promise<IColumnMetadata[]>}
     */
    async fetchColumnsMetadata(connection, config, table) {
        var _a, _b, _c;
        const columnsMetadata = [];
        const query = `
            SELECT 
                c.*,
                CASE WHEN COLUMNPROPERTY(object_id(c.TABLE_SCHEMA +'.' + c.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity') = 1 THEN 'YES' ELSE 'NO' END AS IS_IDENTITY, 
                tc.CONSTRAINT_NAME, 
                tc.CONSTRAINT_TYPE,
                ep.value                AS [COLUMN_COMMENT]               
            FROM information_schema.columns c
            LEFT OUTER JOIN information_schema.key_column_usage ku
                 ON c.TABLE_CATALOG = ku.TABLE_CATALOG AND c.TABLE_NAME = ku.TABLE_NAME AND
                    c.COLUMN_NAME = ku.COLUMN_NAME
            LEFT OUTER JOIN information_schema.table_constraints tc
                 ON c.TABLE_CATALOG = tc.TABLE_CATALOG AND c.TABLE_NAME = tc.TABLE_NAME AND
                    ku.CONSTRAINT_CATALOG = tc.CONSTRAINT_CATALOG AND ku.CONSTRAINT_NAME = tc.CONSTRAINT_NAME                    
            INNER JOIN sysobjects t
                ON c.TABLE_NAME = t.name AND t.type = 'u'
            INNER JOIN syscolumns sc
                ON sc.id = t.id AND sc.name = c.COLUMN_NAME
            LEFT OUTER JOIN sys.extended_properties ep
                 ON ep.major_id = sc.id AND ep.minor_id = sc.colid AND ep.name = 'MS_Description'                                        
            WHERE c.TABLE_CATALOG = N'${config.connection.database}' AND c.TABLE_NAME = N'${table}'
            ORDER BY c.ORDINAL_POSITION;
        `;
        const columns = await connection.query(query, {
            type: sequelize_1.QueryTypes.SELECT,
            raw: true,
        });
        for (const column of columns) {
            // Unknown data type
            if (!this.mapDbTypeToSequelize(column.DATA_TYPE)) {
                (0, utils_1.warnUnknownMappingForDataType)(column.DATA_TYPE);
            }
            const columnMetadata = {
                name: column.COLUMN_NAME,
                originName: column.COLUMN_NAME,
                type: column.DATA_TYPE,
                typeExt: column.DATA_TYPE,
                ...this.mapDbTypeToSequelize(column.DATA_TYPE) && {
                    dataType: 'DataType.' +
                        this.mapDbTypeToSequelize(column.DATA_TYPE).key
                            .split(' ')[0], // avoids 'DOUBLE PRECISION' key to include PRECISION in the mapping
                },
                allowNull: column.IS_NULLABLE.toUpperCase() === 'YES' &&
                    ((_a = column.CONSTRAINT_TYPE) === null || _a === void 0 ? void 0 : _a.toUpperCase()) !== 'PRIMARY KEY',
                primaryKey: ((_b = column.CONSTRAINT_TYPE) === null || _b === void 0 ? void 0 : _b.toUpperCase()) === 'PRIMARY KEY',
                autoIncrement: column.IS_IDENTITY === 'YES',
                indices: [],
                comment: (_c = column.COLUMN_COMMENT) !== null && _c !== void 0 ? _c : undefined,
            };
            // Additional data type information
            switch (column.DATA_TYPE) {
                case 'decimal':
                case 'numeric':
                case 'float':
                case 'double':
                    columnMetadata.dataType +=
                        (0, utils_1.generatePrecisionSignature)(column.NUMERIC_PRECISION, column.NUMERIC_SCALE);
                    break;
                case 'datetime2':
                    columnMetadata.dataType += (0, utils_1.generatePrecisionSignature)(column.DATETIME_PRECISION);
                    break;
                case 'char':
                case 'nchar':
                case 'varchar':
                case 'nvarchar':
                    columnMetadata.dataType += (0, utils_1.generatePrecisionSignature)(column.CHARACTER_MAXIMUM_LENGTH);
                    break;
            }
            columnsMetadata.push(columnMetadata);
        }
        return columnsMetadata;
    }
    async fetchColumnIndexMetadata(connection, config, table, column) {
        const indicesMetadata = [];
        const query = `
            SELECT
                   c.column_id,
                   OBJECT_NAME(i.[object_id]) TableName,
                   i.name                   IndexName,
                   c.name                   ColumnName,
                   ic.is_included_column,
                   i.index_id,
                   i.is_unique,
                   i.data_space_id,
                   i.ignore_dup_key,
                   i.is_primary_key,
                   i.is_unique_constraint,
                   i.type,
                   i.type_desc
            FROM sys.indexes i
                JOIN sys.index_columns ic
                    ON ic.object_id = i.object_id AND i.index_id = ic.index_id
                JOIN sys.columns c
                    ON ic.object_id = c.object_id AND ic.column_id = c.column_id
                JOIN sys.tables t
                    ON t.object_id = c.object_id
            WHERE t.object_id = object_id(N'${table}') AND c.name=N'${column}'
            ORDER BY ic.column_id;
        `;
        const indices = await connection.query(query, {
            type: sequelize_1.QueryTypes.SELECT,
            raw: true,
        });
        for (const index of indices) {
            indicesMetadata.push({
                name: index.IndexName,
                unique: index.is_unique,
            });
        }
        return indicesMetadata;
    }
}
exports.DialectMSSQL = DialectMSSQL;
