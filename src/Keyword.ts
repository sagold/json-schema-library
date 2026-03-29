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

export type SchemaNodeWithRequired<K extends keyof SchemaNode> = SchemaNode & Required<Pick<SchemaNode, K>>;
export type JsonSchemaValidatorParams<Key extends keyof SchemaNode = keyof SchemaNode> = {
    pointer: string;
    data: unknown;
    node: SchemaNodeWithRequired<Key>;
    path: ValidationPath;
};
export interface JsonSchemaValidator<Key extends keyof SchemaNode = keyof SchemaNode> {
    toJSON?: () => string;
    order?: number;
    (options: JsonSchemaValidatorParams<Key>): ValidationReturnType;
}

export type Keyword<Key extends keyof SchemaNode = keyof SchemaNode> = {
    id: string;
    /** unique keyword corresponding to JSON Schema keywords (or custom) */
    keyword: string;
    /** sort order of keyword. Lower numbers will be processed last. Default is 0 */
    order?: number;
    /**
     * Called once for each JSON Schema dduring compileSchema to evaluate keyword.
     * Use this to skip or preprocess the Keyword for the given JSON Schema and
     * to create any schema annotations, like input errors.
     *
     * - most keywords cache their evaluation directly on node, e.g. node.required
     * - most keywords skip any other actions if their evaluation is missing on node
     * - return any errors found in JSON schema related to this keyword
     *      (this includes errors from created nodes)
     */
    parse?: (node: SchemaNode) => void | ValidationAnnotation | ValidationAnnotation[];
    addResolve?: (node: SchemaNode) => boolean;
    /**
     * If this contains child-data, resolve must return schema associated for the passed in key
     *
     * @example
     * a keyword properties has has child-properties. So when a properties[key] exists,
     * it will return the node of properties[key] or nothing at all
     */
    resolve?: JsonSchemaResolver;

    /** return true if the given node should run the validate-function on this keyword */
    addValidate?: (node: SchemaNode) => boolean;
    /**
     * Perform validation for this keyword and the passed in data
     */
    validate?: JsonSchemaValidator<Key>;

    addReduce?: (node: SchemaNode) => boolean;
    /**
     * Remove dynamic schema-keywords by merging valid sub-schemas
     */
    reduce?: JsonSchemaReducer;
};
