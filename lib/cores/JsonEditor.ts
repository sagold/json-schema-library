import CoreInterface from "./CoreInterface";
import step from "../step";
import validate from "../validate";
import resolveOneOf from "../resolveOneOf.fuzzy";
import resolveRef from "../resolveRef.withOverwrite";
import getTemplate from "../getTemplate";
import getSchema from "../getSchema";
import each from "../each";
import { JSONSchema, JSONPointer } from "../types";

import TYPE_KEYWORD_MAPPING from "../validation/typeKeywordMapping";
import KEYWORDS from "../validation/keyword";
import TYPES from "../validation/type";
import FORMATS from "../validation/format";
import ERRORS from "../validation/errors";


export default class JsonEditorCore extends CoreInterface {

    constructor(schema?: JSONSchema) {
        super(schema);
        this.typeKeywords = JSON.parse(JSON.stringify(TYPE_KEYWORD_MAPPING));
        this.validateKeyword = Object.assign({}, KEYWORDS);
        // set properties required per default and prevent no duplicate errors.
        // This is required for fuzzy resolveOneOf
        // this.validateKeyword.properties = this.validateKeyword.propertiesRequired;
        // this.validateKeyword.required = this.validateKeyword.requiredNotEmpty;
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

    resolveOneOf(data, schema: JSONSchema, pointer: JSONPointer) {
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

    step(key: string, schema: JSONSchema, data, pointer: JSONPointer = "#") {
        return step(this, key, schema, data, pointer);
    }
}
