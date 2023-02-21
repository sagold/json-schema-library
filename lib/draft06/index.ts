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

const draft06Config: DraftConfig = {
    typeKeywords: {
        array: [
            "allOf",
            "anyOf",
            "contains",
            "enum",
            "if",
            "items",
            "maxItems",
            "minItems",
            "not",
            "oneOf",
            "uniqueItems"
        ],
        boolean: ["allOf", "anyOf", "enum", "not", "oneOf"],
        object: [
            "additionalProperties",
            "allOf",
            "anyOf",
            "dependencies",
            "enum",
            "format",
            "if",
            "maxProperties",
            "minProperties",
            "not",
            "oneOf",
            "patternProperties",
            "properties",
            "propertyNames",
            "required"
        ],
        string: [
            "allOf",
            "anyOf",
            "enum",
            "format",
            "if",
            "maxLength",
            "minLength",
            "not",
            "oneOf",
            "pattern"
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
        null: ["allOf", "anyOf", "enum", "format", "not", "oneOf"]
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

class Draft06 extends Draft {
    constructor(schema?: JSONSchema, config: Partial<DraftConfig> = {}) {
        super(merge(draft06Config, config), schema);
    }
}

export { Draft06, draft06Config };
