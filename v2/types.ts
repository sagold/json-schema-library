import { JsonError, JsonSchema } from "../lib/types";
import { CreateError } from "../lib/utils/createCustomError";
import { isObject } from "../lib/utils/isObject";

export type JsonSchemaReducerParams = { data: unknown; node: SchemaNode; pointer?: string; path?: ValidationPath };
export type JsonSchemaReducer = (options: JsonSchemaReducerParams) => SchemaNode | JsonError | undefined;

export type JsonSchemaResolverParams = { key: string | number; data: unknown; node: SchemaNode };
export type JsonSchemaResolver = (options: JsonSchemaResolverParams) => SchemaNode | JsonError | undefined;

export type JsonSchemaValidatorParams = { pointer?: string; data: unknown; node: SchemaNode; path?: ValidationPath };
export type JsonSchemaValidator = (options: JsonSchemaValidatorParams) => JsonError | JsonError[] | undefined;

export type JsonSchemaDefaultDataResolverParams = { pointer?: string; data: unknown; node: SchemaNode };
export type JsonSchemaDefaultDataResolver = (options: JsonSchemaDefaultDataResolverParams) => unknown;

export type Context = {
    /** root node of this json-schema */
    rootNode: SchemaNode;
    /** root nodes of registered remote json-schema */
    remotes: Record<string, SchemaNode>;
    /** references stored by fully resolved schema-$id + local-pointer */
    refs: Record<string, SchemaNode>;
    /** references stored by fully resolved schema-$id */
    ids: Record<string, SchemaNode>;
    /** anchors stored by fully resolved schema-$id + $anchor */
    anchors: Record<string, SchemaNode>;
    /** json-schema parser for this json-schema (root-schema and its child nodes) */
    PARSER: ((node: SchemaNode) => void)[];
    /** json-schema validation for this json-schema (root-schema and its child nodes) */
    VALIDATORS: ((node: SchemaNode) => void)[];
    /** json-schema default-data resolver for this json-schema (root-schema and its child nodes) */
    DEFAULT_DATA: ((node: SchemaNode) => void)[];
};

export function isSchemaNode(value: unknown): value is SchemaNode {
    return isObject(value) && Array.isArray(value?.reducers) && Array.isArray(value?.resolvers);
}

export type ValidationPath = {
    pointer: string;
    node: SchemaNode;
}[];

export type SchemaNode = {
    context: Context;
    errors: Record<string, CreateError>;
    parent?: SchemaNode | undefined;
    ref?: string;
    schema: JsonSchema;
    spointer: string;
    oneOfIndex?: number;

    // methods
    resolveRef: (args?: { pointer?: string; path?: ValidationPath }) => SchemaNode;
    /**
     * Register a json-schema as a remote-schema to be resolved by $ref, $anchor, etc
     * @returns the current node (not the remote schema-node)
     */
    addRemote: (url: string, schema: JsonSchema) => SchemaNode;
    /** Compiles a child-schema of this node to its context */
    compileSchema: (schema: JsonSchema, spointer?: string) => SchemaNode;
    /** Step into a property or array by name or index and return the schema-node its value */
    get: (key: string | number, data?: unknown, valiadtionPath?: ValidationPath) => SchemaNode | JsonError;
    /** Creates data that is valid to the schema of this node */
    getTemplate: (data?: unknown) => unknown;
    /** Creates a new node with all dynamic schema properties merged according to the passed in data */
    reduce: ({
        data,
        pointer,
        path
    }: {
        data: unknown;
        pointer?: string;
        path?: ValidationPath;
    }) => SchemaNode | JsonError;
    toJSON: () => unknown;
    validate: (data: unknown, pointer?: string, path?: ValidationPath) => JsonError[];

    // logic
    getDefaultData: JsonSchemaDefaultDataResolver[];
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
