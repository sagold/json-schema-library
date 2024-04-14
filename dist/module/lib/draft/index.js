import copy from "../utils/copy";
import { isJsonError } from "../types";
import { isSchemaNode } from "../schemaNode";
export class Draft {
    constructor(config, schema) {
        /** cache for remote schemas */
        this.remotes = {};
        /** error creators by id */
        this.errors = {};
        /** map for valid keywords of a type  */
        this.typeKeywords = {};
        /** keyword validators  */
        this.validateKeyword = {};
        /** type validators  */
        this.validateType = {};
        /** format validators  */
        this.validateFormat = {};
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
    set rootSchema(rootSchema) {
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
    addRemoteSchema(url, schema) {
        this.config.addRemoteSchema(this, url, schema);
    }
    compileSchema(schema) {
        var _a;
        return this.config.compileSchema(this, schema, (_a = this.rootSchema) !== null && _a !== void 0 ? _a : schema);
    }
    createSchemaOf(data) {
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
    each(data, callback, schema, pointer) {
        const node = this.createNode(schema !== null && schema !== void 0 ? schema : this.rootSchema, pointer);
        return this.config.each(node, data, callback);
    }
    eachSchema(callback, schema = this.rootSchema) {
        return this.config.eachSchema(schema, callback);
    }
    getChildSchemaSelection(property, schema) {
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
    getSchema(options) {
        const result = this.getSchemaNode(options);
        if (isSchemaNode(result)) {
            return result.schema;
        }
        return result;
    }
    getSchemaNode(options) {
        return this.config.getSchema(this, options);
    }
    /**
     * Create data object matching the given schema
     *
     * @param [data] - optional template data
     * @param [schema] - json schema, defaults to rootSchema
     * @return created template data
     */
    getTemplate(data, schema, opts = this.config.templateDefaultOptions) {
        return this.config.getTemplate(this, data, schema, opts);
    }
    isValid(data, schema, pointer) {
        return this.config.isValid(this, data, schema, pointer);
    }
    createNode(schema, pointer = "#") {
        return this.config.createNode(this, schema, pointer);
    }
    resolveAnyOf(node, data) {
        return this.config.resolveAnyOf(node, data);
    }
    resolveAllOf(node, data) {
        return this.config.resolveAllOf(node, data);
    }
    resolveRef(node) {
        return this.config.resolveRef(node);
    }
    resolveOneOf(node, data) {
        return this.config.resolveOneOf(node, data);
    }
    setSchema(schema) {
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
    step(node, key, data) {
        return this.config.step(node, key, data);
    }
    validate(data, schema = this.rootSchema, pointer) {
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
