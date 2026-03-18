"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssociationsParser = void 0;
const fs_1 = __importDefault(require("fs"));
const cardinalities = new Set([
    '1:1',
    '1:N',
    'N:N'
]);
const validateRow = (row) => {
    const [cardinality, leftkey, rightKey, leftTable, rightTable, joinTable] = row;
    if (!cardinalities.has(cardinality)) {
        throw new Error(`Invalid cardinality: must be one of (${Array.from(cardinalities).join(', ')}). Received ${cardinality}`);
    }
    if (!leftkey || !leftkey.length) {
        throw new Error(`Missing required leftKey in association row`);
    }
    if (!rightKey || !rightKey.length) {
        throw new Error(`Missing required rightKey in association row`);
    }
    if (!leftTable || !leftTable.length) {
        throw new Error(`Missing required leftTable in association row`);
    }
    if (!rightTable || !rightTable.length) {
        throw new Error(`Missing required rightTable in association row`);
    }
    if (cardinality === 'N:N' && (!joinTable || !joinTable.length)) {
        throw new Error(`Association N:N requires a joinTable in the association row`);
    }
};
/**
 * @class AssociationsParser
 */
class AssociationsParser {
    /**
     * Parse associations file
     * @param {string} path
     * @returns {IAssociationsParsed}
     */
    static parse(path) {
        // Return cached value if already set
        if (this.associationsMetadata) {
            return this.associationsMetadata;
        }
        const associationsMetadata = {};
        const lines = fs_1.default.readFileSync(path)
            .toString()
            .split('\n')
            .filter(line => line.length); // Filter empty lines
        for (const line of lines) {
            const row = line
                .split(',')
                .map((t, i) => i === 0 ? t.toUpperCase() : t) // Capitalize cardinality
                .map(t => t.trim());
            validateRow(row);
            const [cardinality, leftKey, rightKey, leftModel, rightModel, joinModel] = row;
            const [leftCardinality, rightCardinality] = cardinality.split(':');
            // Add entry for left table
            if (!associationsMetadata[leftModel]) {
                associationsMetadata[leftModel] = {
                    foreignKeys: [],
                    associations: [],
                };
            }
            // Add entry for right table
            if (!associationsMetadata[rightModel]) {
                associationsMetadata[rightModel] = {
                    foreignKeys: [],
                    associations: [],
                };
            }
            // 1:1 and 1:N association
            if (cardinality !== 'N:N') {
                associationsMetadata[leftModel].associations.push({
                    associationName: rightCardinality === '1' ? 'HasOne' : 'HasMany',
                    targetModel: rightModel,
                    sourceKey: leftKey,
                });
                associationsMetadata[rightModel].associations.push({
                    associationName: 'BelongsTo',
                    targetModel: leftModel,
                });
                associationsMetadata[rightModel].foreignKeys.push({
                    name: rightKey,
                    targetModel: leftModel,
                });
            }
            // N:N association
            else {
                // Add entry for join table
                if (!associationsMetadata[joinModel]) {
                    associationsMetadata[joinModel] = {
                        foreignKeys: [],
                        associations: [],
                    };
                }
                associationsMetadata[leftModel].associations.push({
                    associationName: 'BelongsToMany',
                    targetModel: rightModel,
                    joinModel: joinModel,
                });
                associationsMetadata[rightModel].associations.push({
                    associationName: 'BelongsToMany',
                    targetModel: leftModel,
                    joinModel: joinModel,
                });
                associationsMetadata[joinModel].foreignKeys.push({
                    name: leftKey,
                    targetModel: leftModel
                });
                associationsMetadata[joinModel].foreignKeys.push({
                    name: rightKey,
                    targetModel: rightModel
                });
            }
        }
        // Cache result
        this.associationsMetadata = associationsMetadata;
        return this.associationsMetadata;
    }
}
exports.AssociationsParser = AssociationsParser;
