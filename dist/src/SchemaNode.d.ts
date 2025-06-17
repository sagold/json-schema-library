import type { JsonSchemaReducer, JsonSchemaResolver, JsonSchemaValidator, Keyword, ValidationPath } from "./Keyword.js";
import { createSchema } from "./methods/createSchema.js";
import { Draft } from "./Draft.js";
import { JsonSchema, JsonError, ErrorData, OptionalNodeOrError } from "./types.js";
import { TemplateOptions } from "./methods/getData.js";
import { getNode } from "./getNode.js";
import { getNodeChild } from "./getNodeChild.js";
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
    /**
     * Evaluation Path - The location of the keyword that produced the annotation or error.
     * The purpose of this data is to show the resolution path which resulted in the subschema
     * that contains the keyword.
     *
     * - relative to the root of the principal schema; should include (inline) any $ref segments in the path
     * - JSON pointer
     */
    evaluationPath: string;
    /**
     * Schema Location - The direct location to the keyword that produced the annotation
     * or error. This is provided as a convenience to the user so that they don't have to resolve
     * the keyword's subschema, which may not be trivial task. It is only provided if the relative
     * location contains $refs (otherwise, the two locations will be the same).
     *
     * - absolute URI
     * - may not have any association to the principal schema
     */
    schemaLocation: string;
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
    additionalProperties?: SchemaNode;
    allOf?: SchemaNode[];
    anyOf?: SchemaNode[];
    contains?: SchemaNode;
    dependentRequired?: Record<string, string[]>;
    dependentSchemas?: Record<string, SchemaNode | boolean>;
    else?: SchemaNode;
    if?: SchemaNode;
    /**
     * # Items-array schema - for all drafts
     *
     * - for drafts prior 2020-12 `schema.items[]`-schema stored as `node.prefixItems`
     *
     * Validation succeeds if each element of the instance validates against the schema at the
     * same position, if any.
     *
     * The `prefixItems` keyword restricts a number of items from the start of an array instance
     * to validate against the given sequence of subschemas, where the item at a given index in
     * the array instance is evaluated against the subschema at the given index in the `prefixItems`
     * array, if any. Array items outside the range described by the `prefixItems` keyword is
     * evaluated against the items keyword, if present.
     *
     * [Docs](https://www.learnjsonschema.com/2020-12/applicator/prefixitems/)
     * | [Examples](https://json-schema.org/understanding-json-schema/reference/array#tupleValidation)
     */
    prefixItems?: SchemaNode[];
    /**
     * # Items-object schema for additional array item - for all drafts
     *
     * - for drafts prior 2020-12 `schema.additionalItems` object-schema stored as `node.items`
     *
     * Validation succeeds if each element of the instance not covered by `prefixItems` validates
     * against this schema.
     *
     * The items keyword restricts array instance items not described by the sibling `prefixItems`
     * keyword (if any), to validate against the given subschema. Whetherthis keyword was evaluated
     * against any item of the array instance is reported using annotations.
     *
     * [Docs](https://www.learnjsonschema.com/2020-12/applicator/items/)
     * | [Examples](https://json-schema.org/understanding-json-schema/reference/array#items)
     * | [AdditionalItems Specification](https://json-schema.org/draft/2019-09/draft-handrews-json-schema-02#additionalItems)
     */
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
export type ValidateReturnType = {
    /**
     * True, if data is valid to the compiled schema.
     * Does not include async errors.
     */
    valid: boolean;
    /**
     * List of validation errors or empty
     */
    errors: JsonError[];
    /**
     * List of Promises resolving to `JsonError|undefined` or empty.
     */
    errorsAsync: Promise<JsonError | undefined>[];
};
export declare function joinDynamicId(a?: string, b?: string): string;
export declare const SchemaNodeMethods: {
    /**
     * Compiles a child-schema of this node to its context
     * @returns SchemaNode representing the passed JSON Schema
     */
    readonly compileSchema: (schema: JsonSchema, evaluationPath?: string, schemaLocation?: string, dynamicId?: string) => SchemaNode;
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
    readonly getDraftVersion: () => import("./Draft.js").DraftVersion;
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
    readonly validate: (data: unknown, pointer?: string, path?: ValidationPath) => ValidateReturnType;
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
    readonly toDataNodes: (data: unknown, pointer?: string) => import("./methods/toDataNodes.js").DataNode[];
    readonly toJSON: () => any;
};
export declare function addKeywords(node: SchemaNode): void;
export declare function execKeyword(keyword: Keyword, node: SchemaNode): void;
export {};
