import { ITableMetadata } from './Dialect';
import { TransformCase, TransformFn, TransformMap } from '../config/IConfig';
export declare const toUpperCase: (s: string) => string;
export declare const toLowerCase: (s: string) => string;
/**
 * Check if provided string is ASCII
 * @param {string} s
 * @returns {boolean}
 */
export declare const isASCII: (s: string) => boolean;
/**
 * Wrapper for case transformer. Returns unprocessed string for non ASCII characters
 * @param {TransformCase | TransformMap} transformCase
 * @returns {TransformFn}
 */
export declare const transformerFactory: (transformCase: TransformCase | TransformMap) => TransformFn;
/**
 * Get transformer
 * @param {TransformCase | TransformMap | TransformFn} transformCase
 * @returns {TransformFn}
 */
export declare const getTransformer: (transformCase: TransformCase | TransformMap | TransformFn) => TransformFn;
/**
 * Transform ITableMetadata object using the provided case
 * @param {ITableMetadata} tableMetadata
 * @param {TransformCase} transformCase
 * @returns {ITableMetadata}
 */
export declare const caseTransformer: (tableMetadata: ITableMetadata, transformCase: TransformCase | TransformMap | TransformFn) => ITableMetadata;
/**
 * Unknown mapping warning
 * @param {string} dataType
 * @returns {string}
 */
export declare const warnUnknownMappingForDataType: (dataType: string) => void;
/**
 * Generates precision signature
 * @param {Array<string|number>} args
 * @returns {string} (80) or (10,4) or ...
 */
export declare const generatePrecisionSignature: (...args: Array<string | number | undefined | null>) => string;
