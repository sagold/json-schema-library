const CoreInterface = require("./CoreInterface");
const step = require("../step");
const validate = require("../validate");
const resolveOneOf = require("../resolveOneOf.strict");
const resolveRef = require("../resolveRef.strict");
const getTemplate = require("../getTemplate");
const getSchema = require("../getSchema");
const each = require("../each");
const precompile = require("../precompileSchema");


class Draft04Core extends CoreInterface {

    constructor(schema) {
        super(schema);
        this.typeKeywords = JSON.parse(JSON.stringify(require("../validation/typeKeywordMapping")));
        this.validateKeyword = Object.assign({}, require("../validation/keyword"));
        this.validateFormat = Object.assign({}, require("../validation/format"));
        this.errors = Object.assign({}, require("../validation/errors"));
    }

    each(schema, data, callback, pointer = "#") {
        each(this, schema, data, callback, pointer);
    }

    step(key, schema, data, pointer) {
        return step(this, key, schema, data, pointer);
    }

    validate(schema, data, pointer = "#") {
        schema = precompile(this, schema);
        return validate(this, schema, data, pointer);
    }

    isValid(schema, data, pointer = "#") {
        return this.validate(schema, data, pointer).length === 0;
    }

    resolveOneOf(schema, data, pointer) {
        return resolveOneOf(this, schema, data, pointer);
    }

    resolveRef(schema) {
        return resolveRef(schema, this.rootSchema);
    }

    getSchema(schema, data, pointer = "#") {
        return getSchema(this, schema, data, pointer);
    }

    getTemplate(schema, data) {
        return getTemplate(this, schema, data, this.rootSchema);
    }
}


module.exports = Draft04Core;
