"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialectMySQL = void 0;
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const Dialect_1 = require("./Dialect");
const utils_1 = require("./utils");
const sequelizeDataTypesMap = {
    bigint: sequelize_typescript_1.DataType.BIGINT,
    int: sequelize_typescript_1.DataType.INTEGER,
    smallint: sequelize_typescript_1.DataType.SMALLINT,
    mediumint: sequelize_typescript_1.DataType.MEDIUMINT,
    tinyint: sequelize_typescript_1.DataType.TINYINT,
    decimal: sequelize_typescript_1.DataType.DECIMAL,
    float: sequelize_typescript_1.DataType.FLOAT,
    double: sequelize_typescript_1.DataType.DOUBLE,
    bit: sequelize_typescript_1.DataType.INTEGER,
    varchar: sequelize_typescript_1.DataType.STRING,
    char: sequelize_typescript_1.DataType.CHAR,
    text: sequelize_typescript_1.DataType.STRING,
    tinytext: sequelize_typescript_1.DataType.STRING,
    mediumtext: sequelize_typescript_1.DataType.STRING,
    longtext: sequelize_typescript_1.DataType.STRING,
    date: sequelize_typescript_1.DataType.DATEONLY,
    datetime: sequelize_typescript_1.DataType.DATE,
    time: sequelize_typescript_1.DataType.TIME,
    timestamp: sequelize_typescript_1.DataType.DATE,
    year: sequelize_typescript_1.DataType.INTEGER,
    enum: sequelize_typescript_1.DataType.ENUM,
    set: sequelize_typescript_1.DataType.STRING,
    binary: sequelize_typescript_1.DataType.BLOB,
    blob: sequelize_typescript_1.DataType.BLOB,
    tinyblob: sequelize_typescript_1.DataType.BLOB,
    mediumblob: sequelize_typescript_1.DataType.BLOB,
    longblob: sequelize_typescript_1.DataType.BLOB,
    point: sequelize_typescript_1.DataType.GEOMETRY,
    multipoint: sequelize_typescript_1.DataType.GEOMETRY,
    linestring: sequelize_typescript_1.DataType.GEOMETRY,
    multilinestring: sequelize_typescript_1.DataType.GEOMETRY,
    polygon: sequelize_typescript_1.DataType.GEOMETRY,
    multipolygon: sequelize_typescript_1.DataType.GEOMETRY,
    geometry: sequelize_typescript_1.DataType.GEOMETRY,
    geometrycollection: sequelize_typescript_1.DataType.GEOMETRY,
    json: sequelize_typescript_1.DataType.JSON,
};
const jsDataTypesMap = {
    bigint: 'number',
    smallint: 'number',
    mediumint: 'number',
    tinyint: 'number',
    decimal: 'string',
    float: 'number',
    double: 'number',
    int: 'number',
    bit: 'number',
    varchar: 'string',
    char: 'string',
    mediumtext: 'string',
    tinytext: 'string',
    longtext: 'string',
    text: 'string',
    date: 'string',
    time: 'string',
    datetime: 'Date',
    timestamp: 'Date',
    year: 'number',
    enum: 'string',
    set: 'string',
    binary: 'Uint8Array',
    blob: 'Uint8Array',
    tinyblob: 'Uint8Array',
    mediumblob: 'Uint8Array',
    longblob: 'Uint8Array',
    point: 'object',
    multipoint: 'object',
    linestring: 'object',
    multilinestring: 'object',
    polygon: 'object',
    multipolygon: 'object',
    geometry: 'object',
    geometrycollection: 'object',
    json: 'object',
};
const defaultValuesMap = {
    'uuid()': 'DataType.UUIDV4',
    'CURRENT_TIMESTAMP': 'DataType.NOW',
};
const getDefaultValue = (columnDefault) => {
    if (!columnDefault) {
        return null;
    }
    // Check if it is MySQL binary representation (e.g. b'100')
    const regex = new RegExp(/b\'([01]+)\'/g);
    const binaryStringCheck = regex.exec(columnDefault);
    if (binaryStringCheck) {
        const parsed = parseInt(binaryStringCheck[1], 2);
        if (parsed !== null) {
            return parsed;
        }
    }
    return columnDefault;
};
/**
 * Dialect for MySQL
 * @class DialectMySQL
 */
class DialectMySQL extends Dialect_1.Dialect {
    constructor() {
        super('mysql');
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
     * @returns {string}
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
        return defaultValuesMap.hasOwnProperty(v) ? defaultValuesMap[v] : v;
    }
    /**
     * Fetch table names for the provided database/schema
     * @param {Sequelize} connection
     * @param {IConfig} config
     * @returns {Promise<ITable[]>}
     */
    async fetchTables(connection, config) {
        var _a;
        const query = `
            SELECT 
                table_name      AS table_name, 
                table_comment   AS table_comment 
            FROM information_schema.tables
            WHERE table_schema = '${config.connection.database}' 
                ${((_a = config.metadata) === null || _a === void 0 ? void 0 : _a.noViews) ? 'AND table_type <> \'VIEW\'' : ''};
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
        const columnsMetadata = [];
        const query = `
            SELECT 
                c.ORDINAL_POSITION,
                c.TABLE_SCHEMA,
                c.TABLE_NAME,
                c.COLUMN_NAME,
                c.DATA_TYPE,
                c.COLUMN_TYPE,
                c.CHARACTER_MAXIMUM_LENGTH,
                c.NUMERIC_PRECISION,
                c.NUMERIC_SCALE,
                c.DATETIME_PRECISION,                                             
                c.IS_NULLABLE,
                c.COLUMN_KEY,
                c.EXTRA,
                c.COLUMN_DEFAULT,
                c.COLUMN_COMMENT,
                t.TABLE_COMMENT                        
            FROM information_schema.columns c
            INNER JOIN information_schema.tables t
                ON c.TABLE_SCHEMA = t.TABLE_SCHEMA AND c.TABLE_NAME = t.TABLE_NAME                    
            WHERE c.TABLE_SCHEMA = '${config.connection.database}' AND c.TABLE_NAME = '${table}'
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
                typeExt: column.COLUMN_TYPE,
                ...this.mapDbTypeToSequelize(column.DATA_TYPE) && {
                    dataType: 'DataType.' +
                        this.mapDbTypeToSequelize(column.DATA_TYPE).key
                            .split(' ')[0], // avoids 'DOUBLE PRECISION' key to include PRECISION in the mapping
                },
                allowNull: column.IS_NULLABLE === 'YES',
                primaryKey: column.COLUMN_KEY === 'PRI',
                autoIncrement: column.EXTRA === 'auto_increment',
                indices: [],
                comment: column.COLUMN_COMMENT,
                ...column.COLUMN_DEFAULT && { defaultValue: getDefaultValue(column.COLUMN_DEFAULT) },
            };
            // Additional data type informations
            switch (column.DATA_TYPE) {
                case 'decimal':
                case 'numeric':
                case 'float':
                case 'double':
                    columnMetadata.dataType +=
                        (0, utils_1.generatePrecisionSignature)(column.NUMERIC_PRECISION, column.NUMERIC_SCALE);
                    break;
                case 'datetime':
                case 'timestamp':
                    columnMetadata.dataType += (0, utils_1.generatePrecisionSignature)(column.DATETIME_PRECISION);
                    break;
                case 'char':
                case 'varchar':
                    columnMetadata.dataType += (0, utils_1.generatePrecisionSignature)(column.CHARACTER_MAXIMUM_LENGTH);
                    break;
            }
            // ENUM: add values to data type -> DataType.ENUM('v1', 'v2')
            if (column.DATA_TYPE === 'enum') {
                columnMetadata.dataType += columnMetadata.typeExt.match(/\(.*\)/)[0];
            }
            columnsMetadata.push(columnMetadata);
        }
        return columnsMetadata;
    }
    /**
     * Fetch index metadata for the provided table and column
     * @param {Sequelize} connection
     * @param {IConfig} config
     * @param {string} table
     * @param {string} column
     * @returns {Promise<IIndexMetadata[]>}
     */
    async fetchColumnIndexMetadata(connection, config, table, column) {
        const indicesMetadata = [];
        const query = `
            SELECT *                
            FROM information_schema.statistics s
            WHERE TABLE_SCHEMA = '${config.connection.database}' AND TABLE_NAME = '${table}' 
                AND COLUMN_NAME = '${column}';
        `;
        const indices = await connection.query(query, {
            type: sequelize_1.QueryTypes.SELECT,
            raw: true,
        });
        for (const index of indices) {
            indicesMetadata.push({
                name: index.INDEX_NAME,
                using: index.INDEX_TYPE,
                collation: index.COLLATION,
                seq: index.SEQ_IN_INDEX,
                unique: index.NON_UNIQUE === 0,
            });
        }
        return indicesMetadata;
    }
}
exports.DialectMySQL = DialectMySQL;
