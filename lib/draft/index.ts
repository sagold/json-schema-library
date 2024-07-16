import addRemoteSchema from "../addRemoteSchema";
import compileSchema from "../compile";
import copy from "../utils/copy";
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
import { JsonSchema, JsonPointer, JsonError, isJsonError } from "../types";
import { createNode, SchemaNode, isSchemaNode } from "../schemaNode";
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

export class Draft {
    readonly config: DraftConfig;
    /** entry point of schema */
    private __rootSchema: JsonSchema;
    /** cache for remote schemas */
    remotes: Record<string, JsonSchema> = {};
    /** error creators by id */
    readonly errors: Record<string, CreateError> = {};
    /** map for valid keywords of a type  */
    readonly typeKeywords: Record<string, string[]> = {};
    /** keyword validators  */
    readonly validateKeyword: Record<string, JsonValidator> = {};
    /** type validators  */
    readonly validateType: Record<string, JsonTypeValidator> = {};
    /** format validators  */
    readonly validateFormat: Record<string, JsonValidator> = {};

    constructor(config: DraftConfig, schema?: JsonSchema) {
        this.config = config;
        this.typeKeywords = copy(config.typeKeywords);
        this.validateKeyword = Object.assign({}, config.validateKeyword);
        this.validateType = Object.assign({}, config.validateType);
        this.validateFormat = Object.assign({}, config.validateFormat);
        this.errors = Object.assign({}, config.errors);
        this.setSchema(schema);
    }

    get rootSchema() {
        return this.__rootSchema;
    }

    set rootSchema(rootSchema: JsonSchema) {
        if (rootSchema == null) {
            return;
        }
        this.__rootSchema = this.config.compileSchema(this, rootSchema);
    }

    /**
     * register a json-schema to be referenced from another json-schema
     * @param url - base-url of json-schema (aka id)
     * @param schema - json-schema root
     */
    addRemoteSchema(url: string, schema: JsonSchema): void {
        this.config.addRemoteSchema(this, url, schema);
    }

    compileSchema(schema: JsonSchema): JsonSchema {
        return this.config.compileSchema(this, schema, this.rootSchema ?? schema);
    }

    createSchemaOf(data: unknown) {
        return this.config.createSchemaOf(data);
    }

    /**
     * Iterates over data, retrieving its schema
     *
     * @param data - the data to iterate
     * @param callback - will be called with (schema, data, pointer) on each item
     * @param [schema] - the schema matching the data. Defaults to rootSchema
     * @param [pointer] - pointer to current data. Default to rootPointer
     */
    each(data: any, callback: EachCallback, schema?: JsonSchema, pointer?: JsonPointer) {
        const node = this.createNode(schema ?? this.rootSchema, pointer);
        return this.config.each(node, data, callback);
    }

    eachSchema(callback: EachSchemaCallback, schema = this.rootSchema) {
        return this.config.eachSchema(schema, callback);
    }

    getChildSchemaSelection(property: string | number, schema?: JsonSchema) {
        return this.config.getChildSchemaSelection(this, property, schema);
    }

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
    getSchema(options?: GetSchemaOptions): JsonSchema | JsonError | undefined {
        const result = this.getSchemaNode(options);
        if (isSchemaNode(result)) {
            return result.schema;
        }
        return result;
    }

    getSchemaNode(options?: GetSchemaOptions): SchemaNode | JsonError | undefined {
        return this.config.getSchema(this, options);
    }

    /**
     * Create data object matching the given schema
     *
     * @param [data] - optional template data
     * @param [schema] - json schema, defaults to rootSchema
     * @return created template data
     */
    getTemplate(
        data?: unknown,
        schema?: JsonSchema,
        opts: TemplateOptions = this.config.templateDefaultOptions
    ) {
        return this.config.getTemplate(this, data, schema, opts);
    }

    isValid(data: unknown, schema?: JsonSchema, pointer?: JsonPointer): boolean {
        return this.config.isValid(this, data, schema, pointer);
    }

    createNode(schema: JsonSchema, pointer = "#") {
        return this.config.createNode(this, schema, pointer);
    }

    resolveAnyOf(node: SchemaNode, data: unknown): SchemaNode | JsonError {
        return this.config.resolveAnyOf(node, data);
    }

    resolveAllOf(node: SchemaNode, data: unknown): SchemaNode | JsonError {
        return this.config.resolveAllOf(node, data);
    }

    resolveRef(node: SchemaNode): SchemaNode {
        return this.config.resolveRef(node);
    }

    resolveOneOf(node: SchemaNode, data: unknown): SchemaNode | JsonError {
        return this.config.resolveOneOf(node, data);
    }

    setSchema(schema: JsonSchema) {
        this.rootSchema = schema;
    }

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
    step(node: SchemaNode, key: string | number, data: any): SchemaNode | JsonError {
        return this.config.step(node, key, data);
    }

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
    validate(
        data: unknown,
        schema: JsonSchema = this.rootSchema,
        pointer?: JsonPointer
    ): JsonError[] {
        if (isSchemaNode(data)) {
            const inputData = schema;
            const inuptNode = data;
            return this.config.validate(inuptNode, inputData);
        }
        if (isJsonError(data)) {
            return [data];
        }
        const node = this.createNode(schema, pointer);
        return this.config.validate(node, data);
    }
}
