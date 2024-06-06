import addRemoteSchema from "../addRemoteSchema";
import compileSchema from "../compile";
import createSchemaOf from "../createSchemaOf";
import getChildSchemaSelection from "../getChildSchemaSelection";
import getSchema, { GetSchemaOptions } from "../getSchema";
import getTemplate, { TemplateOptions } from "../getTemplate";
import isValid from "../isValid";
import resolveRef from "../resolveRef.strict";
import step from "../step";
import validate from "../validate";
import { CreateError } from "../utils/createCustomError";
import { each, EachCallback } from "../each";
import { eachSchema, EachSchemaCallback } from "../eachSchema";
import { JsonSchema, JsonPointer, JsonError } from "../types";
import { createNode, SchemaNode } from "../schemaNode";
import { JsonValidator, JsonTypeValidator } from "../validation/type";
import { resolveAllOf } from "../features/allOf";
import { resolveAnyOf } from "../features/anyOf";
import { resolveOneOf } from "../features/oneOf";
export type DraftConfig = {
    /** error creators by id */
    errors: Record<string, CreateError>;
    /** map for valid keywords of a type  */
    typeKeywords: Record<string, string[]>;
    /** keyword validators  */
    validateKeyword: Record<string, JsonValidator>;
    /** type validators  */
    validateType: Record<string, JsonTypeValidator>;
    /** format validators  */
    validateFormat: Record<string, JsonValidator>;
    templateDefaultOptions?: TemplateOptions;
    createNode: typeof createNode;
    addRemoteSchema: typeof addRemoteSchema;
    compileSchema: typeof compileSchema;
    createSchemaOf: typeof createSchemaOf;
    each: typeof each;
    eachSchema: typeof eachSchema;
    getChildSchemaSelection: typeof getChildSchemaSelection;
    getSchema: typeof getSchema;
    getTemplate: typeof getTemplate;
    isValid: typeof isValid;
    resolveAllOf: typeof resolveAllOf;
    resolveAnyOf: typeof resolveAnyOf;
    resolveOneOf: typeof resolveOneOf;
    resolveRef: typeof resolveRef;
    step: typeof step;
    validate: typeof validate;
};
export declare class Draft {
    readonly config: DraftConfig;
    /** entry point of schema */
    private __rootSchema;
    /** cache for remote schemas */
    remotes: Record<string, JsonSchema>;
    /** error creators by id */
    readonly errors: Record<string, CreateError>;
    /** map for valid keywords of a type  */
    readonly typeKeywords: Record<string, string[]>;
    /** keyword validators  */
    readonly validateKeyword: Record<string, JsonValidator>;
    /** type validators  */
    readonly validateType: Record<string, JsonTypeValidator>;
    /** format validators  */
    readonly validateFormat: Record<string, JsonValidator>;
    constructor(config: DraftConfig, schema?: JsonSchema);
    get rootSchema(): JsonSchema;
    set rootSchema(rootSchema: JsonSchema);
    /**
     * register a json-schema to be referenced from another json-schema
     * @param url - base-url of json-schema (aka id)
     * @param schema - json-schema root
     */
    addRemoteSchema(url: string, schema: JsonSchema): void;
    compileSchema(schema: JsonSchema): JsonSchema;
    createSchemaOf(data: unknown): JsonSchema;
    /**
     * Iterates over data, retrieving its schema
     *
     * @param data - the data to iterate
     * @param callback - will be called with (schema, data, pointer) on each item
     * @param [schema] - the schema matching the data. Defaults to rootSchema
     * @param [pointer] - pointer to current data. Default to rootPointer
     */
    each(data: any, callback: EachCallback, schema?: JsonSchema, pointer?: JsonPointer): void;
    eachSchema(callback: EachSchemaCallback, schema?: JsonSchema): void;
    getChildSchemaSelection(property: string | number, schema?: JsonSchema): JsonError | JsonSchema[];
    /**
     * Returns the json-schema of a data-json-pointer.
     *
     * To resolve dynamic schema where the type of json-schema is evaluated by
     * its value, a data object has to be passed in options.
     *
     * Per default this function will return `undefined` for valid properties that
     * do not have a defined schema. Use the option `withSchemaWarning: true` to
     * receive an error with `code: schema-warning` containing the location of its
     * last evaluated json-schema.
     *
     * Notes
     *      - uses draft.step to walk through data and schema
     *
     * @param draft
     * @param pointer - json pointer in data to get the json schema for
     * @param [options.data] - the data object, which includes the json pointers value. This is optional, as
     *    long as no oneOf, anyOf, etc statement is part of the pointers schema
     * @param [options.schema] - the json schema to iterate. Defaults to draft.rootSchema
     * @param [options.withSchemaWarning] - if true returns an error instead of `undefined` for valid properties missing a schema definition
     * @return resolved json-schema object of requested json-pointer location
     */
    getSchema(options?: GetSchemaOptions): JsonSchema | JsonError | undefined;
    getSchemaNode(options?: GetSchemaOptions): SchemaNode | JsonError | undefined;
    /**
     * Create data object matching the given schema
     *
     * @param [data] - optional template data
     * @param [schema] - json schema, defaults to rootSchema
     * @return created template data
     */
    getTemplate(data?: unknown, schema?: JsonSchema, opts?: TemplateOptions): any;
    isValid(data: unknown, schema?: JsonSchema, pointer?: JsonPointer): boolean;
    createNode(schema: JsonSchema, pointer?: string): SchemaNode;
    resolveAnyOf(node: SchemaNode, data: unknown): SchemaNode | JsonError;
    resolveAllOf(node: SchemaNode, data: unknown): SchemaNode | JsonError;
    resolveRef(node: SchemaNode): SchemaNode;
    resolveOneOf(node: SchemaNode, data: unknown): SchemaNode | JsonError;
    setSchema(schema: JsonSchema): void;
    /**
     * Returns the json-schema of the given object property or array item.
     * e.g. it steps by one key into the data
     *
     * This helper determines the location of the property within the schema (additional properties, oneOf, ...) and
     * returns the correct schema.
     *
     * @param  node
     * @param  key       - property-name or array-index
     * @param  data      - parent of key
     * @return schema-node containing child schema or error if failed resolving key
     */
    step(node: SchemaNode, key: string | number, data: any): SchemaNode | JsonError;
    /**
     * Validate data by a json schema
     *
     * @param value - value to validate
     * @param [schema] - json schema, defaults to rootSchema
     * @param [pointer] - json pointer pointing to value (used for error-messages only)
     * @return list of errors or empty
     */
    validate(node: SchemaNode, data: unknown): JsonError[];
    validate(data: unknown, schema?: JsonSchema, pointer?: JsonPointer): JsonError[];
}
