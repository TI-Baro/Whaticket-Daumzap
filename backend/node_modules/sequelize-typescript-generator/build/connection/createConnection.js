"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnection = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
/**
 * Create a new sequelize connection
 * @param {Options} options
 * @returns {Sequelize}
 */
const createConnection = (options) => {
    return new sequelize_typescript_1.Sequelize(options);
};
exports.createConnection = createConnection;
