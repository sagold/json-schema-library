const CoreInterface = require("./CoreInterface");
const step = require("../step");
const validate = require("../validate");
const resolveOneOf = require("../resolveOneOf.strict");
const resolveRef = require("../resolveRef.strict");
const getTemplate = require("../getTemplate");
const getSchema = require("../getSchema");
const each = require("../each");
const compileSchema = require("../compileSchema");

const remotes = require("../../remotes");
remotes["http://json-schema.org/draft-04/schema"] = compileSchema(require("../../remotes/draft04.json"));


class Draft04Core extends CoreInterface {

    constructor(schema) {
        super(schema);
        this.typeKeywords = JSON.parse(JSON.stringify(require("../validation/typeKeywordMapping")));
        this.validateKeyword = Object.assign({}, require("../validation/keyword"));
        this.validateType = Object.assign({}, require("../validation/type"));
        this.validateFormat = Object.assign({}, require("../validation/format"));
        this.errors = Object.assign({}, require("../validation/errors"));
    }

    each(data, callback, schema = this.rootSchema, pointer = "#") {
        each(this, data, callback, schema, pointer);
    }

    validate(data, schema = this.rootSchema, pointer = "#") {
        return validate(this, data, schema, pointer);
    }

    isValid(data, schema = this.rootSchema, pointer = "#") {
        return this.validate(data, schema, pointer).length === 0;
    }

    resolveOneOf(data, schema, pointer) {
        return resolveOneOf(this, data, schema, pointer);
    }

    resolveRef(schema) {
        return resolveRef(schema, this.rootSchema);
    }

    getSchema(pointer, data, schema = this.rootSchema) {
        return getSchema(this, pointer, data, schema);
    }

    getTemplate(data, schema = this.rootSchema) {
        return getTemplate(this, data, schema);
    }

    step(key, schema, data, pointer = "#") {
        return step(this, key, schema, data, pointer);
    }
}


module.exports = Draft04Core;
