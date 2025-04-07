import type { getTemplate, TemplateOptions } from "./methods/getTemplate";
import { errors } from "./errors/errors";
import type { getChildSchemaSelection } from "./methods/getChildSchemaSelection";
import type { each, EachCallback } from "./methods/each";
import type { EachSchemaCallback } from "./methods/eachSchema";
import type { createSchema } from "./methods/createSchema";
import type { Keyword, JsonSchemaReducer, JsonSchemaResolver, JsonSchemaValidator, ValidationPath } from "./Keyword";
import { formats } from "./formats/formats";
export type JsonBooleanSchema = boolean;
export type JsonSchema = Record<string, any>;
export type JsonPointer = string;
export type ErrorData<T extends Record<string, unknown> = {
    [p: string]: unknown;
}> = T & {
    pointer: string;
    schema: JsonSchema;
    value: unknown;
};
type DefaultErrors = keyof typeof errors;
export type ErrorConfig = Record<DefaultErrors, string | ((error: ErrorData) => void)>;
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
export declare function isJsonError(error: any): error is JsonError;
export type DraftVersion = "draft-04" | "draft-06" | "draft-07" | "draft-2019-09" | "draft-2020-12" | "latest";
export type Draft = {
    /** test-string if draft can be used with $schema-url */
    $schemaRegEx: string;
    /** draft-version of this draft, e.g. draft-2020-12 */
    version: DraftVersion;
    /** supported keywords and implementation */
    keywords: Keyword[];
    /** draft-dependent methods */
    methods: {
        createSchema: typeof createSchema;
        getChildSchemaSelection: typeof getChildSchemaSelection;
        getTemplate: typeof getTemplate;
        each: typeof each;
    };
    /** meta-schema url associated with this draft */
    $schema?: string;
    /** draft errors (this can still be global) */
    errors: ErrorConfig;
    formats: typeof formats;
};
export type Context = {
    /** root node of this json-schema */
    rootNode: SchemaNode;
    /** root nodes of registered remote json-schema, stored by id/url */
    remotes: Record<string, SchemaNode>;
    /** references stored by fully resolved schema-$id + local-pointer */
    refs: Record<string, SchemaNode>;
    /** references stored by fully resolved schema-$id */
    /** anchors stored by fully resolved schema-$id + $anchor */
    anchors: Record<string, SchemaNode>;
    dynamicAnchors: Record<string, SchemaNode>;
    /** json-schema parser, validator, reducer and resolver for this json-schema (root-schema and its child nodes) */
    keywords: Draft["keywords"];
    /** json-schema draft-dependend methods */
    methods: Draft["methods"];
    /** draft-version */
    version: Draft["version"];
    /** available draft configurations */
    drafts: Draft[];
    errors: Draft["errors"];
    formats: Draft["formats"];
    /** getTemplate default options */
    templateDefaultOptions?: TemplateOptions;
};
export declare function isSchemaNode(value: unknown): value is SchemaNode;
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
    /** If true, creates a json schema for valid but unspecified data, Defaults to false */
    createSchema?: boolean;
};
export type SchemaNode = {
    context: Context;
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
    resolveRef: (args?: {
        pointer?: string;
        path?: ValidationPath;
    }) => SchemaNode;
    createSchema: typeof createSchema;
    createError: <T extends string = DefaultErrors>(name: T, data: ErrorData, message?: string) => JsonError;
    /**
     * Register a json-schema as a remote-schema to be resolved by $ref, $anchor, etc
     * @returns the current node (not the remote schema-node)
     */
    addRemote: (url: string, schema: JsonSchema) => SchemaNode;
    /** Compiles a child-schema of this node to its context */
    compileSchema: (schema: JsonSchema, spointer?: string, schemaId?: string) => SchemaNode;
    /** Step into a property or array by name or index and return the schema-node its value */
    get: (key: string | number, data?: unknown, options?: GetSchemaOptions) => SchemaNode | JsonError;
    getRef: ($ref: string) => SchemaNode | undefined;
    getSchema: (pointer: string, data?: unknown, options?: GetSchemaOptions) => {
        node?: SchemaNode;
        error: undefined;
    } | {
        node: undefined;
        error?: JsonError;
    };
    each: (data: unknown, callback: EachCallback, pointer?: string) => void;
    eachSchema: (callback: EachSchemaCallback) => void;
    getChildSchemaSelection: (property: string | number) => JsonError | SchemaNode[];
    getDraftVersion: () => DraftVersion;
    /** Creates data that is valid to the schema of this node */
    getTemplate: (data?: unknown, options?: TemplateOptions) => unknown;
    /** Creates a new node with all dynamic schema properties merged according to the passed in data */
    reduce: (data: unknown, options?: {
        key?: string | number;
        pointer?: string;
        path?: ValidationPath;
    }) => SchemaNode | JsonError;
    toJSON: () => unknown;
    validateAsync: (data: unknown, pointer?: string, path?: ValidationPath) => Promise<{
        valid: boolean;
        errors: JsonError[];
    }>;
    validate: (data: unknown, pointer?: string, path?: ValidationPath) => {
        valid: boolean;
        errors: JsonError[];
    };
    reducers: JsonSchemaReducer[];
    resolvers: JsonSchemaResolver[];
    validators: JsonSchemaValidator[];
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
    patternProperties?: {
        pattern: RegExp;
        node: SchemaNode;
    }[];
    properties?: Record<string, SchemaNode>;
    propertyNames?: SchemaNode;
    then?: SchemaNode;
    unevaluatedProperties?: SchemaNode;
    unevaluatedItems?: SchemaNode;
};
export {};
