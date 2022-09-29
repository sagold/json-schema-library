import addRemoteSchema from "../addRemoteSchema";
import compileSchema from "../compileSchema";
import { each } from "../each";
import { eachSchema } from "../eachSchema";
import ERRORS from "../validation/errors";
import FORMATS from "../validation/format";
import getSchema from "../getSchema";
import getTemplate from "../getTemplate";
import isValid from "../isValid";
import KEYWORDS from "../validation/keyword";
import merge from "../utils/merge";
import resolveAllOf from "../resolveAllOf";
import resolveAnyOf from "../resolveAnyOf";
import resolveOneOf from "../resolveOneOf.strict";
import resolveRef from "../resolveRef.strict";
import step from "../step";
import createSchemaOf from "../createSchemaOf";
import getChildSchemaSelection from "../getChildSchemaSelection";
import TYPES from "../validation/type";
import validate from "../validate";
import { DraftConfig, Draft } from "../draft";
import { JSONSchema } from "../types";

const draft04Config: DraftConfig = {
    typeKeywords: {
        array: ["enum", "items", "minItems", "maxItems", "uniqueItems", "not"],
        boolean: ["enum", "not"],
        object: [
            "additionalProperties",
            "dependencies",
            "enum",
            "format",
            "minProperties",
            "maxProperties",
            "patternProperties",
            "properties",
            "required",
            "not",
            "oneOf",
            "allOf",
            "anyOf"
        ],
        string: [
            "enum",
            "format",
            "maxLength",
            "minLength",
            "pattern",
            "not",
            "oneOf",
            "allOf",
            "anyOf"
        ],
        number: [
            "enum",
            "format",
            "maximum",
            "minimum",
            "multipleOf",
            "not",
            "oneOf",
            "allOf",
            "anyOf"
        ],
        null: ["enum", "format", "not", "oneOf", "allOf", "anyOf"]
    },
    validateKeyword: KEYWORDS,
    validateType: TYPES,
    validateFormat: FORMATS,
    errors: ERRORS,

    addRemoteSchema,
    compileSchema,
    createSchemaOf,
    each,
    eachSchema,
    getChildSchemaSelection,
    getSchema,
    getTemplate,
    isValid,
    resolveAllOf,
    resolveAnyOf,
    resolveOneOf,
    resolveRef,
    step,
    validate
};

class Draft04 extends Draft {
    constructor(schema?: JSONSchema, config: Partial<DraftConfig> = {}) {
        super(merge(draft04Config, config), schema);
    }
}

export { Draft04, draft04Config };
