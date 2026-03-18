"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePrecisionSignature = exports.warnUnknownMappingForDataType = exports.caseTransformer = exports.getTransformer = exports.transformerFactory = exports.isASCII = exports.toLowerCase = exports.toUpperCase = void 0;
const IConfig_1 = require("../config/IConfig");
const change_case_1 = require("change-case");
const toUpperCase = (s) => s.toUpperCase();
exports.toUpperCase = toUpperCase;
const toLowerCase = (s) => s.toLowerCase();
exports.toLowerCase = toLowerCase;
/**
 * Check if provided string is ASCII
 * @param {string} s
 * @returns {boolean}
 */
const isASCII = (s) => (/^[\x00-\xFF]*$/).test(s);
exports.isASCII = isASCII;
/**
 * Get transformer for case
 * @param {TransformCase} transformCase
 * @returns {CaseTransformer}
 */
const getTransformerForCase = (transformCase) => {
    let transformer;
    switch (transformCase) {
        case "CAMEL":
            transformer = change_case_1.camelCase;
            break;
        case "UPPER":
            transformer = exports.toUpperCase;
            break;
        case "LOWER":
            transformer = exports.toLowerCase;
            break;
        case "PASCAL":
            transformer = change_case_1.pascalCase;
            break;
        case "UNDERSCORE":
            transformer = change_case_1.snakeCase;
            break;
        case "CONST":
            transformer = change_case_1.constantCase;
            break;
        default:
            transformer = (s) => s;
    }
    return transformer;
};
/**
 * Wrapper for case transformer. Returns unprocessed string for non ASCII characters
 * @param {TransformCase | TransformMap} transformCase
 * @returns {TransformFn}
 */
const transformerFactory = (transformCase) => {
    let modelTransformer;
    let columnTransformer;
    if (typeof transformCase === 'string') {
        const transformer = getTransformerForCase(transformCase);
        modelTransformer = transformer;
        columnTransformer = transformer;
    }
    else {
        modelTransformer = getTransformerForCase(transformCase.model);
        columnTransformer = getTransformerForCase(transformCase.column);
    }
    return function (value, target) {
        if (!(0, exports.isASCII)(value)) {
            console.warn(`Unsupported case transformation for non ASCII characters:`, value);
            return value;
        }
        if (target === IConfig_1.TransformTarget.MODEL) {
            return modelTransformer(value);
        }
        return columnTransformer(value);
    };
};
exports.transformerFactory = transformerFactory;
/**
 * Get transformer
 * @param {TransformCase | TransformMap | TransformFn} transformCase
 * @returns {TransformFn}
 */
const getTransformer = (transformCase) => {
    if (typeof transformCase === 'function') {
        return transformCase;
    }
    return (0, exports.transformerFactory)(transformCase);
};
exports.getTransformer = getTransformer;
/**
 * Transform ITableMetadata object using the provided case
 * @param {ITableMetadata} tableMetadata
 * @param {TransformCase} transformCase
 * @returns {ITableMetadata}
 */
const caseTransformer = (tableMetadata, transformCase) => {
    const transformer = (0, exports.getTransformer)(transformCase);
    const transformed = {
        originName: tableMetadata.originName,
        name: transformer(tableMetadata.originName, IConfig_1.TransformTarget.MODEL),
        timestamps: tableMetadata.timestamps,
        columns: {},
        ...tableMetadata.associations && {
            associations: tableMetadata.associations.map(a => {
                a.targetModel = transformer(a.targetModel, IConfig_1.TransformTarget.MODEL);
                if (a.joinModel) {
                    a.joinModel = transformer(a.joinModel, IConfig_1.TransformTarget.MODEL);
                }
                if (a.sourceKey) {
                    a.sourceKey = transformer(a.sourceKey, IConfig_1.TransformTarget.COLUMN);
                }
                return a;
            })
        },
        comment: tableMetadata.comment,
    };
    for (const [columnName, columnMetadata] of Object.entries(tableMetadata.columns)) {
        if (columnMetadata.foreignKey) {
            const { name, targetModel } = columnMetadata.foreignKey;
            columnMetadata.foreignKey = {
                name: transformer(name, IConfig_1.TransformTarget.COLUMN),
                targetModel: transformer(targetModel, IConfig_1.TransformTarget.MODEL),
            };
        }
        transformed.columns[columnName] = Object.assign({}, columnMetadata, { name: transformer(columnMetadata.originName, IConfig_1.TransformTarget.COLUMN) });
    }
    return transformed;
};
exports.caseTransformer = caseTransformer;
/**
 * Unknown mapping warning
 * @param {string} dataType
 * @returns {string}
 */
const warnUnknownMappingForDataType = (dataType) => {
    console.warn(`[Warning]`, `Unknown data type mapping for type '${dataType}'. 
        You should define the data type manually.     
    `);
};
exports.warnUnknownMappingForDataType = warnUnknownMappingForDataType;
/**
 * Generates precision signature
 * @param {Array<string|number>} args
 * @returns {string} (80) or (10,4) or ...
 */
const generatePrecisionSignature = (...args) => {
    const tokens = args.filter(arg => !!arg);
    return tokens.length ? `(${tokens.join(',')})` : '';
};
exports.generatePrecisionSignature = generatePrecisionSignature;
