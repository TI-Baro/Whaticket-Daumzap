"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialectSQLite = void 0;
const sequelize_1 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const Dialect_1 = require("./Dialect");
const utils_1 = require("./utils");
/**
 * Dialect for SQLite
 * @class DialectSQLite
 */
class DialectSQLite extends Dialect_1.Dialect {
    constructor() {
        super('sqlite');
    }
    /**
     * Map database data type to sequelize data type
     * @param {string} dbType
     * @returns {string}
     */
    mapDbTypeToSequelize(dbType) {
        // Affinity rules from https://www.sqlite.org/datatype3.html
        const dbTypeUpper = dbType.toUpperCase();
        if (dbTypeUpper.includes('INT')) {
            return sequelize_typescript_1.DataType.INTEGER;
        }
        else if (dbTypeUpper.includes('CHAR') || dbTypeUpper.includes('CLOB') || dbTypeUpper.includes('TEXT')) {
            return sequelize_typescript_1.DataType.STRING;
        }
        else if (dbTypeUpper.includes('BLOB')) {
            return sequelize_typescript_1.DataType.BLOB;
        }
        else if (dbTypeUpper.includes('REAL') || dbTypeUpper.includes('FLOA') || dbTypeUpper.includes('DOUB')) {
            return sequelize_typescript_1.DataType.REAL;
        }
        else {
            return sequelize_typescript_1.DataType.DECIMAL;
        }
    }
    /**
     * Map database data type to javascript data type
     * @param {string} dbType
     * @returns {string
     */
    mapDbTypeToJs(dbType) {
        // Affinity rules from https://www.sqlite.org/datatype3.html
        const dbTypeUpper = dbType.toUpperCase();
        if (dbTypeUpper.includes('INT')) {
            return 'number';
        }
        else if (dbTypeUpper.includes('CHAR') || dbTypeUpper.includes('CLOB') || dbTypeUpper.includes('TEXT')) {
            return 'string';
        }
        else if (dbTypeUpper.includes('BLOB')) {
            return 'Uint8Array';
        }
        else {
            return 'number';
        }
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
                name    AS table_name
            FROM sqlite_master
            WHERE type ='table' AND name NOT LIKE 'sqlite_%';
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
    async fetchColumnsMetadata(connection, config, table) {
        const columnsMetadata = [];
        const query = `PRAGMA main.table_info('${table}')`;
        const columns = await connection.query(query, {
            type: sequelize_1.QueryTypes.SELECT,
            raw: true,
        });
        for (const column of columns) {
            // Unknown data type
            if (!this.mapDbTypeToSequelize(column.type)) {
                (0, utils_1.warnUnknownMappingForDataType)(column.type);
            }
            const columnMetadata = {
                name: column.name,
                originName: column.name,
                type: column.type,
                typeExt: column.type,
                ...this.mapDbTypeToSequelize(column.type) && {
                    dataType: 'DataType.' +
                        this.mapDbTypeToSequelize(column.type).key
                            .split(' ')[0], // avoids 'DOUBLE PRECISION' key to include PRECISION in the mapping
                },
                allowNull: !!column.notnull,
                primaryKey: !!column.pk,
                autoIncrement: !!column.pk,
                indices: [],
                comment: '', // TODO
            };
            columnsMetadata.push(columnMetadata);
        }
        return columnsMetadata;
    }
    async fetchColumnIndexMetadata(connection, config, table, column) {
        const indicesMetadata = [];
        const query = `
            SELECT
                   il.seq,
                   ii.seqno AS seq_number,
                   ii.cid AS column_id,
                   ii.name as column_name,
                   il.name AS index_name,
                   il.\`unique\` AS is_unique,
                   il.origin,
                   il.partial
            FROM sqlite_master AS m,
                   pragma_index_list(m.name) AS il,
                   pragma_index_info(il.name) AS ii
            WHERE m.type = 'table' AND m.name = '${table}' AND ii.name = '${column}'
            ORDER BY il.seq;
        `;
        const indices = await connection.query(query, {
            type: sequelize_1.QueryTypes.SELECT,
            raw: true,
        });
        for (const index of indices) {
            indicesMetadata.push({
                name: index.index_name,
                seq: index.seq_number,
                unique: !!index.is_unique,
            });
        }
        return indicesMetadata;
    }
}
exports.DialectSQLite = DialectSQLite;
