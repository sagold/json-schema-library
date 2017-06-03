/* eslint no-unused-vars: 0 no-empty-function: 0 */
module.exports = class CoreInterface {

    constructor(schema) {
        this.setSchema(schema);
    }

    get rootSchema() {
        return this.__rootSchema;
    }

    set rootSchema(rootSchema) {
        this.__rootSchema = rootSchema;
    }

    each(schema, data, callback, pointer = "#") {
        return new Error("function 'each' is not implemented");
    }

    step(key, schema, data, pointer = "#") {
        return new Error("function 'step' is not implemented");
    }

    validate(schema, data, pointer = "#") {
        return [new Error("function 'validate' is not implemented")];
    }

    isValid(schema, data, pointer = "#") {
        return new Error("function 'isValid' is not implemented");
    }

    resolveOneOf(schema, data, pointer = "#") {
        return new Error("function 'resolveOneOf' is not implemented");
    }

    resolveRef(schema) {
        return new Error("function 'resolveRef' is not implemented");
    }

    getSchema(schema, data, pointer = "#") {
        return new Error("function 'getSchema' is not implemented");
    }

    getTemplate(schema, data) {
        return new Error("function 'getTemplate' is not implemented");
    }

    setSchema(schema) {
        this.rootSchema = schema;
    }
};
