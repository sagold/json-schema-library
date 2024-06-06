import addRemoteSchema from "../addRemoteSchema";
import compileSchema from "../draft06/compile";
import createSchemaOf from "../createSchemaOf";
import ERRORS from "../validation/errors";
import FORMATS from "../validation/format";
import getChildSchemaSelection from "../getChildSchemaSelection";
import getSchema from "../getSchema";
import getTemplate from "../getTemplate";
import isValid from "../isValid";
import KEYWORDS from "./validation/keyword";
import merge from "../utils/merge";
import resolveRef from "../resolveRef";
import settings from "../config/settings";
import step from "../step";
import TYPES from "../validation/type";
import validate from "../validate";
import { createNode } from "../schemaNode";
import { Draft } from "../draft";
import { each } from "../each";
import { eachSchema } from "../eachSchema";
import { resolveAllOf } from "../features/allOf";
import { resolveAnyOf } from "../features/anyOf";
import { resolveOneOf } from "../features/oneOf";
const draft2019Config = {
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
            "unevaluatedItems",
            "uniqueItems"
        ],
        boolean: ["allOf", "anyOf", "enum", "not", "oneOf"],
        object: [
            "additionalProperties",
            "allOf",
            "anyOf",
            // "dependencies",
            "dependentSchemas",
            "dependentRequired",
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
            "required",
            "unevaluatedProperties" // 2019-09
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
            "allOf",
            "anyOf",
            "enum",
            "exclusiveMaximum",
            "exclusiveMinimum",
            "format",
            "if",
            "maximum",
            "minimum",
            "multipleOf",
            "not",
            "oneOf"
        ],
        null: ["allOf", "anyOf", "enum", "format", "not", "oneOf"]
    },
    validateKeyword: KEYWORDS,
    validateType: TYPES,
    validateFormat: FORMATS,
    errors: ERRORS,
    createNode,
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
    validate,
    templateDefaultOptions: settings.templateDefaultOptions
};
class Draft2019 extends Draft {
    constructor(schema, config = {}) {
        super(merge(draft2019Config, config), schema);
    }
}
export { Draft2019, draft2019Config };
