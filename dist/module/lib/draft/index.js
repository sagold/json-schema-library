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
        return this.config.each(this, data, callback, schema, pointer);
    }
    eachSchema(callback, schema = this.rootSchema) {
        return this.config.eachSchema(schema, callback);
    }
    getChildSchemaSelection(property, schema) {
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
    getSchema(pointer = "#", data, schema) {
        return this.config.getSchema(this, pointer, data, schema);
    }
    /**
     * Create data object matching the given schema
     *
     * @param [data] - optional template data
     * @param [schema] - json schema, defaults to rootSchema
     * @return created template data
     */
    getTemplate(data, schema, opts) {
        return this.config.getTemplate(this, data, schema, opts);
    }
    isValid(data, schema, pointer) {
        return this.config.isValid(this, data, schema, pointer);
    }
    resolveAnyOf(data, schema, pointer) {
        return this.config.resolveAnyOf(this, data, schema, pointer);
    }
    resolveAllOf(data, schema, pointer) {
        return this.config.resolveAllOf(this, data, schema, pointer);
    }
    resolveRef(schema) {
        return this.config.resolveRef(schema, this.rootSchema);
    }
    resolveOneOf(data, schema, pointer) {
        return this.config.resolveOneOf(this, data, schema, pointer);
    }
    setSchema(schema) {
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
    step(key, schema, data, pointer) {
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
    validate(data, schema, pointer) {
        return this.config.validate(this, data, schema, pointer);
    }
}
