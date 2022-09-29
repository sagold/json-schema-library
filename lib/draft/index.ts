import step from "../step";
import validate from "../validate";
import resolveOneOf from "../resolveOneOf.strict";
import resolveRef from "../resolveRef.strict";
import resolveAllOf from "../resolveAllOf";
import resolveAnyOf from "../resolveAnyOf";
import getTemplate, { TemplateOptions } from "../getTemplate";
import getChildSchemaSelection from "../getChildSchemaSelection";
import getSchema from "../getSchema";
import { each, EachCallback } from "../each";
import isValid from "../isValid";
import { eachSchema, EachSchemaCallback } from "../eachSchema";
import createSchemaOf from "../createSchemaOf";
import compileSchema from "../compileSchema";
import { CreateError } from "../utils/createCustomError";
import addRemoteSchema from "../addRemoteSchema";
import { JSONSchema, JSONPointer, JSONValidator, JSONTypeValidator, JSONError } from "../types";

export type DraftConfig = {
    /** error creators by id */
    errors: Record<string, CreateError>;
    /** map for valid keywords of a type  */
    typeKeywords: Record<string, string[]>;
    /** keyword validators  */
    validateKeyword: Record<string, JSONValidator>;
    /** type validators  */
    validateType: Record<string, JSONTypeValidator>;
    /** format validators  */
    validateFormat: Record<string, JSONValidator>;

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
    private __rootSchema: JSONSchema;
    /** cache for remote schemas */
    remotes: Record<string, JSONSchema> = {};
    /** error creators by id */
    readonly errors: Record<string, CreateError> = {};
    /** map for valid keywords of a type  */
    readonly typeKeywords: Record<string, string[]> = {};
    /** keyword validators  */
    readonly validateKeyword: Record<string, JSONValidator> = {};
    /** type validators  */
    readonly validateType: Record<string, JSONTypeValidator> = {};
    /** format validators  */
    readonly validateFormat: Record<string, JSONValidator> = {};

    constructor(config: DraftConfig, schema?: JSONSchema) {
        this.config = config;
        this.typeKeywords = JSON.parse(JSON.stringify(config.typeKeywords));
        this.validateKeyword = Object.assign({}, config.validateKeyword);
        this.validateType = Object.assign({}, config.validateType);
        this.validateFormat = Object.assign({}, config.validateFormat);
        this.errors = Object.assign({}, config.errors);
        this.setSchema(schema);
    }

    get rootSchema() {
        return this.__rootSchema;
    }

    set rootSchema(rootSchema: JSONSchema) {
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
    addRemoteSchema(url: string, schema: JSONSchema): void {
        this.config.addRemoteSchema(this, url, schema);
    }

    compileSchema(schema: JSONSchema): JSONSchema {
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
    each(data: any, callback: EachCallback, schema?: JSONSchema, pointer?: JSONPointer) {
        return this.config.each(this, data, callback, schema, pointer);
    }

    eachSchema(callback: EachSchemaCallback, schema = this.rootSchema) {
        return this.config.eachSchema(schema, callback);
    }

    getChildSchemaSelection(property: string | number, schema?: JSONSchema) {
        return this.config.getChildSchemaSelection(this, property, schema);
    }

    /**
     * Returns the json-schema of a data-json-pointer.
     * Notes
     *   - Uses core.step to walk through data and schema
     *
     * @param pointer - json pointer in data to get the json schema for
     * @param [data] - the data object, which includes the json pointers value. This is optional, as
     *    long as no oneOf, anyOf, etc statement is part of the pointers schema
     * @param [schema] - the json schema to iterate. Defaults to core.rootSchema
     * @return json schema object of the json-pointer or an error
     */
    getSchema(pointer: JSONPointer = "#", data?: any, schema?: JSONSchema): JSONSchema | JSONError {
        return this.config.getSchema(this, pointer, data, schema);
    }

    /**
     * Create data object matching the given schema
     *
     * @param [data] - optional template data
     * @param [schema] - json schema, defaults to rootSchema
     * @return created template data
     */
    getTemplate(data?: unknown, schema?: JSONSchema, opts?: TemplateOptions) {
        return this.config.getTemplate(this, data, schema, opts);
    }

    isValid(data: any, schema?: JSONSchema, pointer?: JSONPointer): boolean {
        return this.config.isValid(this, data, schema, pointer);
    }

    resolveAnyOf(data: any, schema: JSONSchema, pointer?: JSONPointer): JSONSchema {
        return this.config.resolveAnyOf(this, data, schema, pointer);
    }

    resolveAllOf(data: any, schema: JSONSchema, pointer?: JSONPointer): JSONSchema {
        return this.config.resolveAllOf(this, data, schema, pointer);
    }

    resolveRef(schema: JSONSchema): JSONSchema {
        return this.config.resolveRef(schema, this.rootSchema);
    }

    resolveOneOf(data: any, schema: JSONSchema, pointer?: JSONPointer): JSONSchema {
        return this.config.resolveOneOf(this, data, schema, pointer);
    }

    setSchema(schema: JSONSchema) {
        this.rootSchema = schema;
    }

    /**
     * Returns the json-schema of the given object property or array item.
     * e.g. it steps by one key into the data
     *
     *  This helper determines the location of the property within the schema (additional properties, oneOf, ...) and
     *  returns the correct schema.
     *
     * @param  key       - property-name or array-index
     * @param  schema    - json schema of current data
     * @param  data      - parent of key
     * @param  [pointer] - pointer to schema and data (parent of key)
     * @return Schema or Error if failed resolving key
     */
    step(key: string | number, schema: JSONSchema, data: any, pointer?: JSONPointer): JSONSchema {
        return this.config.step(this, key, schema, data, pointer);
    }

    /**
     * Validate data by a json schema
     *
     * @param value - value to validate
     * @param [schema] - json schema, defaults to rootSchema
     * @param [pointer] - json pointer pointing to value (used for error-messages only)
     * @return list of errors or empty
     */
    validate(data: unknown, schema?: JSONSchema, pointer?: JSONPointer): JSONError[] {
        return this.config.validate(this, data, schema, pointer);
    }
}
