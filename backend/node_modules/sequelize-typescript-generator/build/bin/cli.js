#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cli = void 0;
const yargs_1 = __importDefault(require("yargs"));
const builders_1 = require("../builders");
const utils_1 = require("./utils");
process.on('unhandledRejection', (reason, promise) => {
    console.error(reason, promise);
    process.exit(1);
});
const cli = async () => {
    let usage = `Usage: stg -D <dialect> -d [database] -u [username] -x [password] `;
    usage += `-h [host] -p [port] -o [out-dir] -s [schema] -a [associations-file]`;
    usage += `-t [tables] -T [skip-tables] -V [no-views] -i [indices] -C [case] -S [storage] -L [lint-file] `;
    usage += `-l [ssl] -r [protocol] -n [dialect-options] -c [clean] -g [logs]`;
    const { argv } = yargs_1.default
        .usage(usage)
        .demand(['dialect'])
        .option('h', {
        alias: utils_1.aliasesMap.HOST,
        string: true,
        describe: `Database IP/hostname`,
    })
        .option('p', {
        alias: utils_1.aliasesMap.PORT,
        number: true,
        describe: `Database port. Defaults: \n - MySQL/MariaDB: 3306 \n - Postgres: 5432 \n - MSSQL: 1433`,
    })
        .option('d', {
        alias: utils_1.aliasesMap.DATABASE,
        string: true,
        describe: `Database name`,
    })
        .option('s', {
        alias: utils_1.aliasesMap.SCHEMA,
        string: true,
        describe: `Schema name (Postgres only). Default: \n - public`,
    })
        .option('D', {
        alias: utils_1.aliasesMap.DIALECT,
        string: true,
        describe: `Dialect: \n - postgres \n - mysql \n - mariadb \n - sqlite \n - mssql`,
    })
        .option('u', {
        alias: utils_1.aliasesMap.USERNAME,
        string: true,
        describe: `Database username`,
    })
        .option('x', {
        alias: utils_1.aliasesMap.PASSWORD,
        string: true,
        describe: `Database password`,
    })
        .option('t', {
        alias: utils_1.aliasesMap.TABLES,
        string: true,
        describe: `Comma-separated names of tables to process`,
    })
        .option('T', {
        alias: utils_1.aliasesMap.SKIP_TABLES,
        string: true,
        describe: `Comma-separated names of tables to skip`,
    })
        .option('i', {
        alias: utils_1.aliasesMap.INDICES,
        boolean: true,
        describe: `Include index annotations in the generated models`,
    })
        .option('o', {
        alias: utils_1.aliasesMap.OUTPUT_DIR,
        string: true,
        describe: `Output directory. Default: \n - ${utils_1.defaultOutputDir}`,
    })
        .option('c', {
        alias: utils_1.aliasesMap.OUTPUT_DIR_CLEAN,
        boolean: true,
        describe: `Clean output directory before running`,
    })
        .option('m', {
        alias: utils_1.aliasesMap.TIMESTAMPS,
        boolean: true,
        describe: `Add default timestamps to tables`,
    })
        .option('C', {
        alias: utils_1.aliasesMap.CASE,
        string: true,
        describe: `Transform tables and fields names with one of the following cases:
             - underscore
             - camel
             - upper
             - lower
             - pascal
             - const
             You can also specify a different case for model and columns using the following format:
               <model case>:<column case>    
            `,
    }).option('S', {
        alias: utils_1.aliasesMap.STORAGE,
        string: true,
        describe: `SQLite storage. Default: \n - memory`,
    }).option('L', {
        alias: utils_1.aliasesMap.LINT_FILE,
        string: true,
        describe: `ES Lint file path`,
    }).option('l', {
        alias: utils_1.aliasesMap.SSL,
        boolean: true,
        describe: `Enable SSL`,
    }).option('r', {
        alias: utils_1.aliasesMap.PROTOCOL,
        string: true,
        describe: `Protocol used: Default: \n - tcp`,
    }).option('a', {
        alias: utils_1.aliasesMap.ASSOCIATIONS_FILE,
        string: true,
        describe: `Associations file path`,
    }).option('g', {
        alias: utils_1.aliasesMap.ENABLE_SEQUELIZE_LOGS,
        boolean: true,
        describe: `Enable Sequelize logs`,
    }).option('n', {
        alias: utils_1.aliasesMap.DIALECT_OPTIONS,
        type: 'string',
        describe: `Dialect native options passed as json string.`,
    }).option('f', {
        alias: utils_1.aliasesMap.DIALECT_OPTIONS_FILE,
        type: 'string',
        describe: `Dialect native options passed as json file path.`,
    }).option('R', {
        alias: utils_1.aliasesMap.DISABLE_STRICT,
        boolean: true,
        describe: `Disable strict typescript class declaration.`,
    }).option('V', {
        alias: utils_1.aliasesMap.DISABLE_VIEWS,
        boolean: true,
        describe: `Disable views generation. Available for: MySQL and MariaDB.`,
    });
    (0, utils_1.validateArgs)(argv);
    const config = (0, utils_1.buildConfig)(argv);
    const dialect = (0, utils_1.buildDialect)(argv);
    const builder = new builders_1.ModelBuilder(config, dialect);
    await builder.build();
    console.log(`All done!`);
};
exports.cli = cli;
(async () => {
    await (0, exports.cli)();
})();
