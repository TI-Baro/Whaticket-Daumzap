export interface IAssociationMetadata {
    associationName: 'HasOne' | 'HasMany' | 'BelongsTo' | 'BelongsToMany';
    targetModel: string;
    joinModel?: string;
    sourceKey?: string;
}
export interface IForeignKey {
    name: string;
    targetModel: string;
}
export interface IAssociationsParsed {
    [tableName: string]: {
        foreignKeys: IForeignKey[];
        associations: IAssociationMetadata[];
    };
}
/**
 * @class AssociationsParser
 */
export declare class AssociationsParser {
    private static associationsMetadata;
    /**
     * Parse associations file
     * @param {string} path
     * @returns {IAssociationsParsed}
     */
    static parse(path: string): IAssociationsParsed;
}
