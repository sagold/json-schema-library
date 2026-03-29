import { KEYWORD } from "./keywords/propertyDependencies";
import type { SchemaNode, JsonError, JsonAnnotation } from "./types";

export type ValidationPath = {
    pointer: string;
    node: SchemaNode;
}[];

export type JsonSchemaReducerParams = {
    /** data of current node */
    data: unknown;
    /** optional key to used to resolve by property without having data */
    key: string | number;
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

// type MaybeAsync<T> = T | Promise<T>;
// type MaybeArray<T> = T | T[];
export type Maybe<T> = T | undefined;
export type ValidationAnnotation = JsonError | JsonAnnotation | Promise<Maybe<ValidationAnnotation>[]>;
type ValidationResult = Maybe<ValidationAnnotation>;
export type ValidationReturnType = ValidationResult | ValidationResult[];

type SchemaNodeWithRequired<K extends keyof SchemaNode> = SchemaNode & Required<Pick<SchemaNode, K>>;
export type JsonSchemaValidatorParams<Key extends keyof SchemaNode = never> = {
    pointer: string;
    data: unknown;
    node: SchemaNodeWithRequired<Key>;
    path: ValidationPath;
};
export interface JsonSchemaValidator<Key extends keyof SchemaNode = never> {
    toJSON?: () => string;
    order?: number;
    (options: JsonSchemaValidatorParams<Key>): ValidationReturnType;
}

export type Keyword<Key extends keyof SchemaNode = never> = {
    id: string;
    /** unique keyword corresponding to JSON Schema keywords (or custom) */
    keyword: string;
    /** sort order of keyword. Lower numbers will be processed last. Default is 0 */
    order?: number;
    /** called with compileSchema */
    parse?: (node: SchemaNode) => void | ValidationAnnotation | ValidationAnnotation[];
    addResolve?: (node: SchemaNode) => boolean;
    /** return node corresponding to passed in key or do nothing */
    resolve?: JsonSchemaResolver;

    /** return true if the given node should run the validate-function on this keyword */
    addValidate?: (node: SchemaNode) => boolean;
    /** validate data using node */
    validate?: JsonSchemaValidator<Key>;

    addReduce?: (node: SchemaNode) => boolean;
    /** remove dynamic schema-keywords by merging valid sub-schemas */
    reduce?: JsonSchemaReducer;
};
