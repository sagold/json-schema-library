import type { JsonSchemaReducer, JsonSchemaResolver, JsonSchemaValidator, Keyword, ValidationPath } from "./Keyword";
import { createSchema } from "./methods/createSchema";
import { Draft } from "./Draft";
import { JsonSchema, JsonError, ErrorData, OptionalNodeAndError } from "./types";
import { TemplateOptions } from "./methods/getData";
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
    templateDefaultOptions?: TemplateOptions;
};
export interface SchemaNode extends SchemaNodeMethodsType {
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
    dependencies?: Record<string, SchemaNode | boolean | string[]>;
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
export type GetSchemaOptions = {
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
    readonly createError: <T extends string = "AdditionalItemsError" | "AdditionalPropertiesError" | "AllOfError" | "AnyOfError" | "ConstError" | "ContainsAnyError" | "ContainsArrayError" | "ContainsError" | "ContainsMinError" | "ContainsMaxError" | "EnumError" | "ExclusiveMaximumError" | "ExclusiveMinimumError" | "ForbiddenPropertyError" | "FormatDateError" | "FormatDateTimeError" | "FormatDurationError" | "FormatEmailError" | "FormatHostnameError" | "FormatIPV4Error" | "FormatIPV4LeadingZeroError" | "FormatIPV6Error" | "FormatIPV6LeadingZeroError" | "FormatJsonPointerError" | "FormatRegExError" | "FormatTimeError" | "FormatURIError" | "FormatURIReferenceError" | "FormatURITemplateError" | "FormatURLError" | "FormatUUIDError" | "InvalidDataError" | "InvalidPropertyNameError" | "MaximumError" | "MaxItemsError" | "MaxLengthError" | "MaxPropertiesError" | "MinimumError" | "MinItemsError" | "MinItemsOneError" | "MinLengthError" | "MinLengthOneError" | "MissingOneOfDeclaratorError" | "MinPropertiesError" | "MissingArrayItemError" | "MissingDependencyError" | "MissingOneOfPropertyError" | "MultipleOfError" | "MultipleOneOfError" | "NoAdditionalPropertiesError" | "NotError" | "OneOfError" | "OneOfPropertyError" | "PatternError" | "PatternPropertiesError" | "RequiredPropertyError" | "SchemaWarning" | "TypeError" | "UndefinedValueError" | "UnevaluatedPropertyError" | "UnevaluatedItemsError" | "UniqueItemsError" | "UnknownPropertyError" | "ValueNotEmptyError">(name: T, data: ErrorData, message?: string) => JsonError;
    readonly createSchema: typeof createSchema;
    readonly getChildSchemaSelection: (property: string | number) => JsonError | SchemaNode[];
    /**
     * Returns a node containing JSON Schema of a data-JSON Pointer.
     *
     * To resolve dynamic schema where the type of JSON Schema is evaluated by
     * its value, a data object has to be passed in options.
     *
     * Per default this function will return `undefined` schema for valid properties
     * that do not have a defined schema. Use the option `withSchemaWarning: true` to
     * receive an error with `code: schema-warning` containing the location of its
     * last evaluated json-schema.
     *
     * Example:
     *
     * ```ts
     * draft.setSchema({ type: "object", properties: { title: { type: "string" } } });
     * const result = draft.getSchema({  pointer: "#/title" }, data: { title: "my header" });
     * const schema = isSchemaNode(result) ? result.schema : undefined;
     * // schema = { type: "string" }
     * ```
     */
    readonly getSchema: (pointer: string, data?: unknown, options?: GetSchemaOptions) => OptionalNodeAndError;
    /**
     * @returns for $ref, the corresponding SchemaNode or undefined
     */
    readonly getRef: ($ref: string) => SchemaNode | undefined;
    /**
     * @returns child node identified by property as SchemaNode
     */
    readonly getChild: (key: string | number, data?: unknown, options?: GetSchemaOptions) => OptionalNodeAndError;
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
    readonly reduceSchema: (data: unknown, options?: {
        key?: string | number;
        pointer?: string;
        path?: ValidationPath;
    }) => OptionalNodeAndError;
    /**
     * @returns validation result of data validated by this node's JSON Schema
     */
    readonly validate: (data: unknown, pointer?: string, path?: ValidationPath) => {
        valid: boolean;
        errors: JsonError[];
    };
    /**
     * @returns a promise which resolves to validation-result
     */
    readonly validateAsync: (data: unknown, pointer?: string, path?: ValidationPath) => Promise<{
        valid: boolean;
        errors: JsonError[];
    }>;
    /**
     * Register a JSON Schema as a remote-schema to be resolved by $ref, $anchor, etc
     * @returns the current node (not the remote schema-node)
     */
    readonly addRemote: (url: string, schema: JsonSchema) => SchemaNode;
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
