const resolveRef = require("../resolveRef.withOverwrite");
const compileSchema = require("../compileSchema");
const resolveAnyOf = require("../resolveAnyOf");
const resolveAllOf = require("../resolveAllOf");


/* eslint no-unused-vars: 0 no-empty-function: 0 */
module.exports = class CoreInterface {

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
        return new Error("function 'each' is not implemented");
    }

    validate(data, schema = this.rootSchema, pointer = "#") {
        return [new Error("function 'validate' is not implemented")];
    }

    isValid(data, schema = this.rootSchema, pointer = "#") {
        return new Error("function 'isValid' is not implemented");
    }

    resolveAnyOf(data, schema, pointer = "#") {
        return resolveAnyOf(this, data, schema, pointer);
    }

    resolveAllOf(data, schema, pointer = "#") {
        return resolveAllOf(this, data, schema, pointer);
    }

    resolveRef(schema) {
        return new Error("function 'resolveRef' is not implemented");
    }

    resolveOneOf(data, schema, pointer = "#") {
        return new Error("function 'resolveOneOf' is not implemented");
    }

    getSchema(pointer, data, schema = this.rootSchema) {
        return new Error("function 'getSchema' is not implemented");
    }

    getTemplate(data, schema = this.rootSchema) {
        return new Error("function 'getTemplate' is not implemented");
    }

    setSchema(schema) {
        this.rootSchema = schema;
    }

    step(key, schema, data, pointer = "#") {
        return new Error("function 'step' is not implemented");
    }
};
