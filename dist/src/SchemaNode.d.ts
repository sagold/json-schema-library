import type { JsonSchemaReducer, JsonSchemaResolver, JsonSchemaValidator, Keyword, ValidationPath } from "./Keyword";
import { createSchema } from "./methods/createSchema";
import { Draft } from "./Draft";
import { JsonSchema, JsonError, ErrorData, OptionalNodeOrError } from "./types";
import { TemplateOptions } from "./methods/getData";
import { getNode } from "./getNode";
import { getNodeChild } from "./getNodeChild";
export declare function isSchemaNode(value: unknown): value is SchemaNode;
export declare function isReduceable(node: SchemaNode): boolean;
export type Context = {
    /** root node of this JSON Schema */
    rootNode: SchemaNode;
    /** available draft configurations */
    drafts: Draft[];
    /** [SHARED ACROSS REMOTES] root nodes of registered remote JSON Schema, stored by id/url */
    remotes: Record<string, SchemaNode>;
    /** references stored by fully resolved schema-$id + local-pointer */
    refs: Record<string, SchemaNode>;
    /** anchors stored by fully resolved schema-$id + $anchor */
    anchors: Record<string, SchemaNode>;
    /** [SHARED ACROSS REMOTES] dynamicAnchors stored by fully resolved schema-$id + $anchor */
    dynamicAnchors: Record<string, SchemaNode>;
    /** JSON Schema parser, validator, reducer and resolver for this JSON Schema (root schema and its child nodes) */
    keywords: Draft["keywords"];
    /** JSON Schema draft dependend methods */
    methods: Draft["methods"];
    /** draft version */
    version: Draft["version"];
    /** draft errors & template-strings */
    errors: Draft["errors"];
    /** draft formats & validators */
    formats: Draft["formats"];
    /** [SHARED USING ADD REMOTE] getData default options */
    getDataDefaultOptions?: TemplateOptions;
};
export interface SchemaNode extends SchemaNodeMethodsType {
    /** shared context across nodes of JSON schema and shared properties across all remotes */
    context: Context;
    /** JSON Schema of node */
    schema: JsonSchema;
    /** absolute path into JSON Schema, includes $ref for resolved schema */
    spointer: string;
    /** local path within JSON Schema (not extended by resolving ref) */
    schemaId: string;
    /** id created when combining subschemas */
    dynamicId: string;
    /** reference to parent node (node used to compile this node) */
    parent?: SchemaNode | undefined;
    /** JSON Pointer from last $id ~~to this location~~ to resolve $refs to $id#/idLocalPointer */
    lastIdPointer: string;
    /** when reduced schema containing `oneOf` schema, `oneOfIndex` stores `oneOf`-item used for merge */
    oneOfIndex?: number;
    reducers: JsonSchemaReducer[];
    resolvers: JsonSchemaResolver[];
    validators: JsonSchemaValidator[];
    resolveRef?: (args?: {
        pointer?: string;
        path?: ValidationPath;
    }) => SchemaNode;
    $id?: string;
    $defs?: Record<string, SchemaNode>;
    $ref?: string;
    /** only used for draft <= 2019-09 */
    additionalItems?: SchemaNode;
    additionalProperties?: SchemaNode;
    allOf?: SchemaNode[];
    anyOf?: SchemaNode[];
    contains?: SchemaNode;
    dependentRequired?: Record<string, string[]>;
    dependentSchemas?: Record<string, SchemaNode | boolean>;
    else?: SchemaNode;
    if?: SchemaNode;
    prefixItems?: SchemaNode[];
    items?: SchemaNode;
    not?: SchemaNode;
    oneOf?: SchemaNode[];
    patternProperties?: {
        name: string;
        pattern: RegExp;
        node: SchemaNode;
    }[];
    properties?: Record<string, SchemaNode>;
    propertyNames?: SchemaNode;
    then?: SchemaNode;
    unevaluatedItems?: SchemaNode;
    unevaluatedProperties?: SchemaNode;
}
type SchemaNodeMethodsType = typeof SchemaNodeMethods;
export type GetNodeOptions = {
    /**
     *  Per default `undefined` is returned for valid data, but undefined schema.
     *
     * - Using `withSchemaWarning:true` will return an error instead: `{ type: "error", code: "schema-warning" }`
     */
    withSchemaWarning?: boolean;
    /**
     *  Per default `undefined` is returned for valid data, but undefined schema.
     *
     * - Using `createSchema:true` will create a schema instead
     */
    createSchema?: boolean;
    path?: ValidationPath;
    pointer?: string;
};
export declare function joinDynamicId(a?: string, b?: string): string;
export declare const SchemaNodeMethods: {
    /**
     * Compiles a child-schema of this node to its context
     * @returns SchemaNode representing the passed JSON Schema
     */
    readonly compileSchema: (schema: JsonSchema, spointer?: string, schemaId?: string, dynamicId?: string) => SchemaNode;
    readonly createError: <T extends string = "additional-items-error" | "additional-properties-error" | "all-of-error" | "any-of-error" | "const-error" | "contains-any-error" | "contains-array-error" | "contains-error" | "contains-min-error" | "contains-max-error" | "enum-error" | "exclusive-maximum-error" | "exclusive-minimum-error" | "forbidden-property-error" | "format-date-error" | "format-date-time-error" | "format-duration-error" | "format-email-error" | "format-hostname-error" | "format-ipv4-error" | "format-ipv4-leading-zero-error" | "format-ipv6-error" | "format-ipv6-leading-zero-error" | "format-json-pointer-error" | "format-regex-error" | "format-time-error" | "format-uri-error" | "format-uri-reference-error" | "format-uri-template-error" | "format-url-error" | "format-uuid-error" | "invalid-data-error" | "invalid-property-name-error" | "maximum-error" | "max-items-error" | "max-length-error" | "max-properties-error" | "minimum-error" | "min-items-error" | "min-items-one-error" | "min-length-error" | "min-length-one-error" | "missing-one-of-declarator-error" | "min-properties-error" | "missing-array-item-error" | "missing-dependency-error" | "missing-one-of-property-error" | "multiple-of-error" | "multiple-one-of-error" | "no-additional-properties-error" | "not-error" | "one-of-error" | "one-of-property-error" | "pattern-error" | "pattern-properties-error" | "required-property-error" | "schema-warning" | "type-error" | "undefined-value-error" | "unevaluated-property-error" | "unevaluated-items-error" | "unique-items-error" | "unknown-property-error" | "value-not-empty-error">(code: T, data: ErrorData, message?: string) => JsonError;
    readonly createSchema: typeof createSchema;
    readonly getChildSelection: (property: string | number) => JsonError | SchemaNode[];
    readonly getNode: typeof getNode;
    readonly getNodeChild: typeof getNodeChild;
    /**
     * @returns for $ref, the corresponding SchemaNode or undefined
     */
    readonly getNodeRef: ($ref: string) => SchemaNode | undefined;
    readonly getNodeRoot: () => SchemaNode;
    /**
     * @returns draft version this JSON Schema is evaluated by
     */
    readonly getDraftVersion: () => import("./Draft").DraftVersion;
    /**
     * @returns data that is valid to the schema of this node
     */
    readonly getData: (data?: unknown, options?: TemplateOptions) => any;
    /**
     * @returns SchemaNode with a reduced JSON Schema matching the given data
     */
    readonly reduceNode: (data: unknown, options?: {
        key?: string | number;
        pointer?: string;
        path?: ValidationPath;
    }) => OptionalNodeOrError;
    /**
     * @returns validation result of data validated by this node's JSON Schema
     */
    readonly validate: (data: unknown, pointer?: string, path?: ValidationPath) => {
        valid: boolean;
        errors: JsonError[];
        errorsAsync: Promise<JsonError | undefined>[];
    };
    /**
     * Register a JSON Schema as a remote-schema to be resolved by $ref, $anchor, etc
     * @returns the current node (not the remote schema-node)
     */
    readonly addRemoteSchema: (url: string, schema: JsonSchema) => SchemaNode;
    /**
     * @returns a list of all sub-schema as SchemaNode
     */
    readonly toSchemaNodes: () => SchemaNode[];
    /**
     * @returns a list of values (including objects and arrays) and their corresponding JSON Schema as SchemaNode
     */
    readonly toDataNodes: (data: unknown, pointer?: string) => import("..").DataNode[];
    readonly toJSON: () => any;
};
export declare function addKeywords(node: SchemaNode): void;
export declare function execKeyword(keyword: Keyword, node: SchemaNode): void;
export {};
