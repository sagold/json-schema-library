const CoreInterface = require("./CoreInterface");
const step = require("../step");
const validate = require("../validate");
const resolveOneOf = require("../resolveOneOf.fuzzy");
const resolveRef = require("../resolveRef.withOverwrite");
const getTemplate = require("../getTemplate");
const getSchema = require("../getSchema");
const each = require("../each");


class JsonEditorCore extends CoreInterface {

    constructor(schema) {
        super(schema);
        this.typeKeywords = JSON.parse(JSON.stringify(require("../validation/typeKeywordMapping")));
        this.validateKeyword = Object.assign({}, require("../validation/keyword"));
        // set properties required per default and prevent no duplicate errors.
        // This is required for fuzzy resolveOneOf
        // this.validateKeyword.properties = this.validateKeyword.propertiesRequired;
        // this.validateKeyword.required = this.validateKeyword.requiredNotEmpty;
        this.validateType = Object.assign({}, require("../validation/type"));
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

    getSchema(pointer, data, schema) {
        return getSchema(this, pointer, data, schema);
    }

    getTemplate(schema, data) {
        return getTemplate(this, schema, data, this.rootSchema);
    }
}


module.exports = JsonEditorCore;
