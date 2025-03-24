import { CreateError } from "./errors/createCustomError";
import { isObject } from "./utils/isObject";
import { TemplateOptions } from "./getTemplate";

export type JsonSchema = { [p: string]: any };
export type JsonPointer = string;

export type ErrorData<T extends Record<string, unknown> = { [p: string]: unknown }> = T & {
    /* json-pointer to location of error */
    pointer: string;
    /* json-schema of error location */
    schema: JsonSchema;
    /* value: data in error location */
    value: unknown;
};
export type JsonError<T extends ErrorData = ErrorData> = {
    type: "error";
    name: string;
    code: string;
    message: string;
    data: T;
    [p: string]: unknown;
};
/**
 * ts type guard for json error
 * @returns true if passed type is a JsonError
 */
export function isJsonError(error: any): error is JsonError {
    return error?.type === "error";
}

export type DraftVersion = "draft-04" | "draft-06" | "draft-07" | "draft-2019-09" | "latest";

export type Draft = {
    features: Feature[];
    version: DraftVersion;
    $schema?: string;
};

export type DraftList = { regexp: string; draft: Draft }[];

export type Feature = {
    id: string;
    keyword: string;

    parse?: (node: SchemaNode) => void;

    addResolve?: (node: SchemaNode) => boolean;
    resolve?: JsonSchemaResolver;

    addValidate?: (node: SchemaNode) => boolean;
    validate?: JsonSchemaValidator;

    addReduce?: (node: SchemaNode) => boolean;
    reduce?: JsonSchemaReducer;
};

export type JsonSchemaReducerParams = {
    data: unknown;
    /** optional key to used to resolve by property without having data */
    key?: string | number;
    node: SchemaNode;
    pointer?: string;
    path?: ValidationPath;
};

export type JsonSchemaReducer = (options: JsonSchemaReducerParams) => SchemaNode | JsonError | undefined;

export type JsonSchemaResolverParams = { key: string | number; data: unknown; node: SchemaNode };
export type JsonSchemaResolver = (options: JsonSchemaResolverParams) => SchemaNode | JsonError | undefined;

export type JsonSchemaValidatorParams = { pointer?: string; data: unknown; node: SchemaNode; path?: ValidationPath };
export type JsonSchemaValidator = (options: JsonSchemaValidatorParams) => JsonError | JsonError[] | undefined;

export type JsonSchemaDefaultDataResolverParams = {
    pointer?: string;
    data?: unknown;
    node: SchemaNode;
    options?: TemplateOptions;
};
export type JsonSchemaDefaultDataResolver = (options: JsonSchemaDefaultDataResolverParams) => unknown;

export type Context = {
    /** root node of this json-schema */
    rootNode: SchemaNode;
    /** root nodes of registered remote json-schema, stored by id/url */
    remotes: Record<string, SchemaNode>;
    /** references stored by fully resolved schema-$id + local-pointer */
    refs: Record<string, SchemaNode>;
    /** references stored by fully resolved schema-$id */
    ids: Record<string, SchemaNode>;
    /** anchors stored by fully resolved schema-$id + $anchor */
    anchors: Record<string, SchemaNode>;
    /** json-schema parser, validator, reducer and resolver for this json-schema (root-schema and its child nodes) */
    features?: Feature[];

    // runtime configuration

    /** draft-version */
    version: string;
    /** available draft configurations */
    drafts: DraftList;
    /** getTemplate default options */
    templateDefaultOptions?: TemplateOptions;
};

export function isSchemaNode(value: unknown): value is SchemaNode {
    return isObject(value) && Array.isArray(value?.reducers) && Array.isArray(value?.resolvers);
}

export type ValidationPath = {
    pointer: string;
    node: SchemaNode;
}[];

export type GetSchemaOptions = {
    path?: ValidationPath;
    pointer?: string;
    /**
     *  Get always returns `undefined` for valid data, but undefined schema.
     *  Using `withSchemaWarning: true` will return an error instead:
     *
     *  ```json
     *  { type: "error", code: "schema-warning" }
     *  ```
     */
    withSchemaWarning?: boolean;
};

export type SchemaNode = {
    context: Context;
    errors: Record<string, CreateError>;
    parent?: SchemaNode | undefined;
    ref?: string;
    schema: JsonSchema;
    spointer: string;
    /** local path within json-schema (not extended by resolving ref) */
    schemaId: string;
    /**
     * @todo this is a ref specific property as is $id
     * json-pointer from last $id ~~to this location~~ to resolve $refs to $id#/idLocalPointer
     * */
    lastIdPointer: string;
    oneOfIndex?: number;

    // methods
    resolveRef: (args?: { pointer?: string; path?: ValidationPath }) => SchemaNode;
    /**
     * Register a json-schema as a remote-schema to be resolved by $ref, $anchor, etc
     * @returns the current node (not the remote schema-node)
     */
    addRemote: (url: string, schema: JsonSchema) => SchemaNode;
    /** Compiles a child-schema of this node to its context */
    compileSchema: (schema: JsonSchema, spointer?: string, schemaId?: string) => SchemaNode;
    /** Step into a property or array by name or index and return the schema-node its value */
    get: (key: string | number, data?: unknown, options?: GetSchemaOptions) => SchemaNode | JsonError;
    getSchema: (pointer: string, data?: unknown, options?: GetSchemaOptions) => SchemaNode | JsonError | undefined;
    /** Creates data that is valid to the schema of this node */
    getTemplate: (data?: unknown, options?: TemplateOptions) => unknown;
    /** Creates a new node with all dynamic schema properties merged according to the passed in data */
    reduce: ({
        data,
        pointer,
        key,
        path
    }: {
        data: unknown;
        key?: string | number;
        pointer?: string;
        path?: ValidationPath;
    }) => SchemaNode | JsonError;
    toJSON: () => unknown;
    validate: (data: unknown, pointer?: string, path?: ValidationPath) => JsonError[];

    // logic
    reducers: JsonSchemaReducer[];
    resolvers: JsonSchemaResolver[];
    validators: JsonSchemaValidator[];

    // parsed schema (registered by parsers...)
    $defs?: Record<string, SchemaNode>;
    $id?: string;
    additionalItems?: SchemaNode;
    additionalProperties?: SchemaNode;
    allOf?: SchemaNode[];
    anyOf?: SchemaNode[];
    contains?: SchemaNode;
    dependencies?: Record<string, SchemaNode | boolean | string[]>;
    dependentSchemas?: Record<string, SchemaNode | boolean>;
    else?: SchemaNode;
    if?: SchemaNode;
    itemsList?: SchemaNode[];
    itemsObject?: SchemaNode;
    not?: SchemaNode;
    oneOf?: SchemaNode[];
    patternProperties?: { pattern: RegExp; node: SchemaNode }[];
    properties?: Record<string, SchemaNode>;
    propertyNames?: SchemaNode;
    then?: SchemaNode;
    unevaluatedProperties?: SchemaNode;
    unevaluatedItems?: SchemaNode;
};
