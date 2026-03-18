import * as ts from 'typescript';
/**
 * Returns string representation of typescript node
 * @param node
 * @returns {string}
 */
export declare const nodeToString: (node: ts.Node) => string;
/**
 * Generate named imports code (e.g. `import { Something, Else } from "module"`)
 * @param {string[]} importsSpecifier
 * @param {string} moduleSpecifier
 * @returns {string} Named import code
 */
export declare const generateNamedImports: (importsSpecifier: string[], moduleSpecifier: string) => ts.ImportDeclaration;
/**
 * Generate model export for index file
 * @param {string} modelFileName
 * @returns {ts.ExportDeclaration}
 */
export declare const generateIndexExport: (modelFileName: string) => ts.ExportDeclaration;
/**
 * Generate object literal decorator
 * @param {string} decoratorIdentifier
 * @param {[key: string]: any} props
 * @return {ts.Decorator}
 */
export declare const generateObjectLiteralDecorator: (decoratorIdentifier: string, props: {
    [key: string]: any;
}) => ts.Decorator;
/**
 * Generate arrow decorator
 * @param {string} decoratorIdentifier
 * @param {string[]} arrowTargetIdentifiers
 * @param {object} objectLiteralProps
 * @returns {ts.Decorator}
 */
export declare const generateArrowDecorator: (decoratorIdentifier: string, arrowTargetIdentifiers: string[], objectLiteralProps?: object) => ts.Decorator;
