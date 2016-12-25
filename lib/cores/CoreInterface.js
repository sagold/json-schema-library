/* eslint no-unused-vars: 0 no-empty-function: 0 */
module.exports = class CoreInterface {

    constructor(schema) {
        this.rootSchema = schema;
    }

    get rootSchema() {
        return this.__rootSchema;
    }

    set rootSchema(rootSchema) {
        this.__rootSchema = rootSchema;
    }

    // function step(key, schema, data, root = schema, pointer) {
    step(key, schema, data, pointer = "#") {
        return new Error("function 'step' is not implemented");
    }

    // validate(schema, value, step, root = schema, pointer = "#")
    validate(schema, data, pointer = "#") {
        return [new Error("function 'validate' is not implemented")];
    }

    isValid(schema, data, pointer = "#") {
        return new Error("function 'isValid' is not implemented");
    }

    // resolveOneOf(schema, data, step, rootSchema = schema, pointer)
    resolveOneOf(schema, data, pointer = "#") {
        return new Error("function 'resolveOneOf' is not implemented");
    }
};
