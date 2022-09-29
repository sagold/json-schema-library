import addRemoteSchema from "../addRemoteSchema";
import compileSchema from "../draft06/compile";
import { each } from "../each";
import { eachSchema } from "../eachSchema";
import ERRORS from "../validation/errors";
import FORMATS from "../validation/format";
import getSchema from "../getSchema";
import getTemplate from "../getTemplate";
import isValid from "../isValid";
import KEYWORDS from "../draft06/validation/keyword";
import merge from "../utils/merge";
import resolveAllOf from "../resolveAllOf";
import resolveAnyOf from "../resolveAnyOf";
import resolveOneOf from "../resolveOneOf.strict";
import resolveRef from "../resolveRef.strict";
import createSchemaOf from "../createSchemaOf";
import getChildSchemaSelection from "../getChildSchemaSelection";
import step from "../step";
import TYPES from "../draft06/validation/type";
import validate from "../validate";
import { DraftConfig, Draft } from "../draft";
import { JSONSchema } from "../types";

const draft07Config: DraftConfig = {
    typeKeywords: {
        array: ["enum", "contains", "items", "minItems", "maxItems", "uniqueItems", "not", "if"],
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
            "propertyNames",
            "required",
            "not",
            "oneOf",
            "allOf",
            "anyOf",
            "if"
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
            "anyOf",
            "if"
        ],
        number: [
            "enum",
            "exclusiveMaximum",
            "exclusiveMinimum",
            "format",
            "maximum",
            "minimum",
            "multipleOf",
            "not",
            "oneOf",
            "allOf",
            "anyOf",
            "if"
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

class Draft07 extends Draft {
    constructor(schema?: JSONSchema, config: Partial<DraftConfig> = {}) {
        super(merge(draft07Config, config), schema);
    }
}

export { Draft07, draft07Config };
