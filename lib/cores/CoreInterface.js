const resolveRef = require("../resolveRef.withOverwrite");
const precompile = require("../precompileSchema");
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
        // initially resolve any $refs on rootschema (in case this is a reference to a remote or self-referenced schema)
        const schema = precompile(this, rootSchema);
        this.__rootSchema = resolveRef(schema, schema);
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

    resolveAnyOf(schema, data, pointer = "#") {
        return resolveAnyOf(this, schema, data, pointer);
    }

    resolveAllOf(schema, data, pointer = "#") {
        return resolveAllOf(this, schema, data, pointer);
    }

    resolveRef(schema) {
        return new Error("function 'resolveRef' is not implemented");
    }

    resolveOneOf(schema, data, pointer = "#") {
        return new Error("function 'resolveOneOf' is not implemented");
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
