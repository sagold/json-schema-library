const CoreInterface = require("./CoreInterface");
const step = require("../step");
const validate = require("../validate");
const resolveOneOf = require("../resolveOneOf");


class JsonEditorCore extends CoreInterface {

    constructor(schema) {
        super(schema);
        this.validateKeyword = Object.assign({}, require("../validation/keyword"));
        this.validateType = Object.assign({}, require("../validation/type"));
        this.validateFormat = Object.assign({}, require("../validation/format"));
        this.errors = Object.assign({}, require("../validation/errors"));
    }

    get rootSchema() {
        return this.__rootSchema;
    }

    set rootSchema(rootSchema) {
        this.__rootSchema = rootSchema;
    }

    // function step(key, schema, data, root = schema, pointer) {
    step(key, schema, data, pointer) {
        return step(this, key, schema, data, pointer);
    }

    validate(schema, data, pointer = "#") {
        return validate(this, schema, data, pointer);
    }

    isValid(schema, data, pointer = "#") {
        return this.validate(schema, data, pointer).length === 0;
    }

    resolveOneOf(schema, data, pointer) {
        return resolveOneOf(this, schema, data, pointer);
    }
}


module.exports = JsonEditorCore;
