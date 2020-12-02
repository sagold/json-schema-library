import CoreInterface from "./CoreInterface";
import step from "../step";
import validate from "../validate";
import resolveOneOf from "../resolveOneOf.strict";
import resolveRef from "../resolveRef.strict";
import getTemplate from "../getTemplate";
import getSchema from "../getSchema";
import each from "../each";
import compileSchema from "../compileSchema";
import { JSONSchema, JSONPointer } from "../types";

import remotes from "../../remotes";
import draft04 from "../../remotes/draft04.json";
remotes["http://json-schema.org/draft-04/schema"] = compileSchema(draft04);

import TYPE_KEYWORD_MAPPING from "../validation/typeKeywordMapping";
import KEYWORDS from "../validation/keyword";
import TYPES from "../validation/type";
import FORMATS from "../validation/format";
import ERRORS from "../validation/errors";


export default class Draft04Core extends CoreInterface {

    typeKeywords;
    validateKeyword;
    validateType;
    validateFormat;
    errors;

    constructor(schema?: JSONSchema) {
        super(schema);
        this.typeKeywords = JSON.parse(JSON.stringify(TYPE_KEYWORD_MAPPING));
        this.validateKeyword = Object.assign({}, KEYWORDS);
        this.validateType = Object.assign({}, TYPES);
        this.validateFormat = Object.assign({}, FORMATS);
        this.errors = Object.assign({}, ERRORS);
    }

    each(data: any, callback, schema: JSONSchema = this.rootSchema, pointer: JSONPointer = "#") {
        each(this, data, callback, schema, pointer);
    }

    validate(data: any, schema: JSONSchema = this.rootSchema, pointer: JSONPointer = "#") {
        return validate(this, data, schema, pointer);
    }

    isValid(data: any, schema: JSONSchema = this.rootSchema, pointer: JSONPointer = "#") {
        return this.validate(data, schema, pointer).length === 0;
    }

    resolveOneOf(data: any, schema: JSONSchema, pointer: JSONPointer) {
        return resolveOneOf(this, data, schema, pointer);
    }

    resolveRef(schema: JSONSchema) {
        return resolveRef(schema, this.rootSchema);
    }

    getSchema(pointer: JSONPointer, data: any, schema: JSONSchema = this.rootSchema) {
        return getSchema(this, pointer, data, schema);
    }

    getTemplate(data: any, schema: JSONSchema = this.rootSchema) {
        return getTemplate(this, data, schema);
    }

    step(key: string, schema: JSONSchema, data: any, pointer: JSONPointer = "#") {
        return step(this, key, schema, data, pointer);
    }
}
