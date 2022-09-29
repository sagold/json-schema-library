import compileSchema from "../compileSchema";
import resolveAnyOf from "../resolveAnyOf";
import resolveAllOf from "../resolveAllOf";
/* eslint no-unused-vars: 0 no-empty-function: 0 */
export default class CoreInterface {
    constructor(schema) {
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
        this.setSchema(schema);
    }
    get rootSchema() {
        return this.__rootSchema;
    }
    set rootSchema(rootSchema) {
        if (rootSchema == null) {
            return;
        }
        this.__rootSchema = compileSchema(rootSchema);
    }
    each(data, callback, schema = this.rootSchema, pointer = "#") {
        throw new Error("function 'each' is not implemented");
    }
    validate(data, schema = this.rootSchema, pointer = "#") {
        throw new Error("function 'validate' is not implemented");
    }
    isValid(data, schema = this.rootSchema, pointer = "#") {
        throw new Error("function 'isValid' is not implemented");
    }
    resolveAnyOf(data, schema, pointer = "#") {
        return resolveAnyOf(this, data, schema, pointer);
    }
    resolveAllOf(data, schema, pointer = "#") {
        return resolveAllOf(this, data, schema, pointer);
    }
    resolveRef(schema) {
        throw new Error("function 'resolveRef' is not implemented");
    }
    resolveOneOf(data, schema, pointer = "#") {
        throw new Error("function 'resolveOneOf' is not implemented");
    }
    getSchema(pointer, data, schema = this.rootSchema) {
        throw new Error("function 'getSchema' is not implemented");
    }
    getTemplate(data, schema = this.rootSchema) {
        throw new Error("function 'getTemplate' is not implemented");
    }
    setSchema(schema) {
        this.rootSchema = schema;
    }
    /**
     * Returns the json-schema of the given object property or array item.
     * e.g. it steps by one key into the data
     * This helper determines the location of the property within the schema
     * (additional properties, oneOf, ...) and returns the correct schema.
     *
     * @param key    property-name or array-index
     * @param schema json schema of current data
     * @param data   parent object or array of key
     * @param [pointer] json pointer of parent object or array
     * @return schema or error if failed resolving key
     */
    step(key, schema, data, pointer = "#") {
        throw new Error("function 'step' is not implemented");
    }
}
