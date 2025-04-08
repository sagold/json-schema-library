import type { SchemaNode, JsonError } from "./types";

export type ValidationPath = {
    pointer: string;
    node: SchemaNode;
}[];

export type JsonSchemaReducerParams = {
    /** data of current node */
    data: unknown;
    /** optional key to used to resolve by property without having data */
    key?: string | number;
    /** node to reduce */
    node: SchemaNode;
    /** JSON pointer to data */
    pointer: string;
    /** passed through path for schema resolution, will be changed by reference */
    path: ValidationPath;
};
export interface JsonSchemaReducer {
    toJSON?: () => string;
    order?: number;
    (options: JsonSchemaReducerParams): SchemaNode | JsonError | undefined;
}

export type JsonSchemaResolverParams = { key: string | number; data: unknown; node: SchemaNode };
export interface JsonSchemaResolver {
    toJSON?: () => string;
    order?: number;
    (options: JsonSchemaResolverParams): SchemaNode | JsonError | undefined;
}

export type ValidationResult = JsonError | Promise<JsonError>;

export type JsonSchemaValidatorParams = { pointer?: string; data: unknown; node: SchemaNode; path?: ValidationPath };
export interface JsonSchemaValidator {
    toJSON?: () => string;
    order?: number;
    (options: JsonSchemaValidatorParams): undefined | JsonError | ValidationResult[];
}

export type Keyword = {
    id: string;
    /** unique keyword corresponding to JSON Schema keywords (or custom) */
    keyword: string;
    /** sort order of keyword. Lower numbers will be processed last. Default is 0 */
    order?: number;
    /** called with compileSchema */
    parse?: (node: SchemaNode) => void;
    addResolve?: (node: SchemaNode) => boolean;
    /** return node corresponding to passed in key or do nothing */
    resolve?: JsonSchemaResolver;

    addValidate?: (node: SchemaNode) => boolean;
    /** validate data using node */
    validate?: JsonSchemaValidator;

    addReduce?: (node: SchemaNode) => boolean;
    /** remove dynamic schema-keywords by merging valid sub-schemas */
    reduce?: JsonSchemaReducer;
};
