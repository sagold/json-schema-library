import compileSchema from "../compileSchema";
import resolveAnyOf from "../resolveAnyOf";
import resolveAllOf from "../resolveAllOf";
/* eslint no-unused-vars: 0 no-empty-function: 0 */
export default class CoreInterface {
    constructor(schema) {
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
    step(key, schema, data, pointer = "#") {
        throw new Error("function 'step' is not implemented");
    }
}
