import CoreInterface from "./CoreInterface";
import step from "../step";
import validate from "../validate";
import resolveOneOf from "../resolveOneOf.strict";
import resolveRef from "../resolveRef.strict";
import getTemplate from "../getTemplate";
import getSchema from "../getSchema";
import addSchema from "../addSchema";
import each from "../each";
import compileSchema from "../draft06/compile";
import draft07 from "../../remotes/draft07.json";
import TYPE_KEYWORD_MAPPING from "../draft06/validation/typeKeywordMapping";
import KEYWORDS from "../draft06/validation/keyword";
import TYPES from "../draft06/validation/type";
import FORMATS from "../validation/format";
import ERRORS from "../validation/errors";
import addValidator from "../addValidator";
addSchema("http://json-schema.org/draft-07/schema", draft07);
export default class Draft07Core extends CoreInterface {
    constructor(schema) {
        super(schema);
        this.typeKeywords = JSON.parse(JSON.stringify(TYPE_KEYWORD_MAPPING));
        Object.assign(this.validateKeyword, KEYWORDS);
        Object.assign(this.validateType, TYPES);
        Object.keys(FORMATS).forEach(id => addValidator.format(this, id, FORMATS[id]));
        Object.keys(ERRORS).forEach(id => addValidator.error(this, id, ERRORS[id]));
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
