import type { JsonSchemaReducer, JsonSchemaResolver, JsonSchemaValidator, Keyword, ValidationPath } from "./Keyword";
import { createSchema } from "./methods/createSchema";
import { Draft } from "./Draft";
import { EachSchemaCallback } from "./methods/eachSchema";
import { JsonSchema, JsonError, ErrorData, OptionalNodeAndError } from "./types";
import { TemplateOptions } from "./methods/getTemplate";
export declare function isSchemaNode(value: unknown): value is SchemaNode;
export declare function isReduceable(node: SchemaNode): boolean;
export type Context = {
    /** root node of this json-schema */
    rootNode: SchemaNode;
    /** available draft configurations */
    drafts: Draft[];
    /** [SHARED ACROSS REMOTES] root nodes of registered remote json-schema, stored by id/url */
    remotes: Record<string, SchemaNode>;
    /** references stored by fully resolved schema-$id + local-pointer */
    refs: Record<string, SchemaNode>;
    /** anchors stored by fully resolved schema-$id + $anchor */
    anchors: Record<string, SchemaNode>;
    /** [SHARED ACROSS REMOTES] dynamicAnchors stored by fully resolved schema-$id + $anchor */
    dynamicAnchors: Record<string, SchemaNode>;
    /** json-schema parser, validator, reducer and resolver for this json-schema (root-schema and its child nodes) */
    keywords: Draft["keywords"];
    /** json-schema draft-dependend methods */
    methods: Draft["methods"];
    /** draft-version */
    version: Draft["version"];
    errors: Draft["errors"];
    formats: Draft["formats"];
    /** [SHARED USING ADD REMOTE] getTemplate default options */
    templateDefaultOptions?: TemplateOptions;
};
export interface SchemaNode extends SchemaNodeMethodsType {
    context: Context;
    schema: JsonSchema;
    spointer: string;
    /** local path within json-schema (not extended by resolving ref) */
    schemaId: string;
    parent?: SchemaNode | undefined;
    /** json-pointer from last $id ~~to this location~~ to resolve $refs to $id#/idLocalPointer */
    lastIdPointer: string;
    oneOfIndex?: number;
    reducers: JsonSchemaReducer[];
    resolvers: JsonSchemaResolver[];
    validators: JsonSchemaValidator[];
    resolveRef?: (args?: {
        pointer?: string;
        path?: ValidationPath;
    }) => SchemaNode;
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
    ref?: string;
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
export declare const SchemaNodeMethods: {
    /** Compiles a child-schema of this node to its context */
    readonly compileSchema: (schema: JsonSchema, spointer?: string, schemaId?: string) => SchemaNode;
    readonly createError: <T extends string = "AdditionalItemsError" | "AdditionalPropertiesError" | "AllOfError" | "AnyOfError" | "ConstError" | "ContainsAnyError" | "ContainsArrayError" | "ContainsError" | "ContainsMinError" | "ContainsMaxError" | "EnumError" | "ExclusiveMaximumError" | "ExclusiveMinimumError" | "ForbiddenPropertyError" | "FormatDateError" | "FormatDateTimeError" | "FormatDurationError" | "FormatEmailError" | "FormatHostnameError" | "FormatIPV4Error" | "FormatIPV4LeadingZeroError" | "FormatIPV6Error" | "FormatIPV6LeadingZeroError" | "FormatJsonPointerError" | "FormatRegExError" | "FormatTimeError" | "FormatURIError" | "FormatURIReferenceError" | "FormatURITemplateError" | "FormatURLError" | "FormatUUIDError" | "InvalidDataError" | "InvalidPropertyNameError" | "MaximumError" | "MaxItemsError" | "MaxLengthError" | "MaxPropertiesError" | "MinimumError" | "MinItemsError" | "MinItemsOneError" | "MinLengthError" | "MinLengthOneError" | "MissingOneOfDeclaratorError" | "MinPropertiesError" | "MissingArrayItemError" | "MissingDependencyError" | "MissingOneOfPropertyError" | "MultipleOfError" | "MultipleOneOfError" | "NoAdditionalPropertiesError" | "NotError" | "OneOfError" | "OneOfPropertyError" | "PatternError" | "PatternPropertiesError" | "RequiredPropertyError" | "SchemaWarning" | "TypeError" | "UndefinedValueError" | "UnevaluatedPropertyError" | "UnevaluatedItemsError" | "UniqueItemsError" | "UnknownPropertyError" | "ValueNotEmptyError">(name: T, data: ErrorData, message?: string) => JsonError;
    readonly createSchema: typeof createSchema;
    readonly eachSchema: (callback: EachSchemaCallback) => void;
    readonly getChildSchemaSelection: (property: string | number) => JsonError | SchemaNode[];
    /**
     * Returns a node containing json-schema of a data-json-pointer.
     *
     * To resolve dynamic schema where the type of json-schema is evaluated by
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
    readonly getRef: ($ref: string) => SchemaNode | undefined;
    readonly getChild: (key: string | number, data?: unknown, options?: GetSchemaOptions) => OptionalNodeAndError;
    readonly getDraftVersion: () => import("./Draft").DraftVersion;
    /** Creates data that is valid to the schema of this node */
    readonly getTemplate: (data?: unknown, options?: TemplateOptions) => any;
    readonly reduce: (data: unknown, options?: {
        key?: string | number;
        pointer?: string;
        path?: ValidationPath;
    }) => OptionalNodeAndError;
    /** Creates a new node with all dynamic schema properties merged according to the passed in data */
    readonly validate: (data: unknown, pointer?: string, path?: ValidationPath) => {
        valid: boolean;
        errors: JsonError[];
    };
    readonly validateAsync: (data: unknown, pointer?: string, path?: ValidationPath) => Promise<{
        valid: boolean;
        errors: JsonError[];
    }>;
    /**
     * Register a json-schema as a remote-schema to be resolved by $ref, $anchor, etc
     * @returns the current node (not the remote schema-node)
     */
    readonly addRemote: (url: string, schema: JsonSchema) => SchemaNode;
    readonly toDataNodes: (data: unknown, pointer?: string) => import("..").DataNode[];
    readonly toJSON: () => any;
};
export declare function addKeywords(node: SchemaNode): void;
export declare function execKeyword(keyword: Keyword, node: SchemaNode): void;
export {};
