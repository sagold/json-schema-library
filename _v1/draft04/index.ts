import addRemoteSchema from "./addRemoteSchema";
import compileSchema from "../compile";
import createSchemaOf from "../createSchemaOf";
import ERRORS from "../validation/errors";
import FORMATS from "../validation/format";
import getChildSchemaSelection from "../getChildSchemaSelection";
import getSchema from "../getSchema";
import getTemplate from "../getTemplate";
import isValid from "../isValid";
import KEYWORDS from "../validation/keyword";
import merge from "../utils/merge";
import resolveRef from "../resolveRef.strict";
import step from "../step";
import TYPES from "../validation/type";
import validate from "../validate";
import { createNode } from "../schemaNode";
import { DraftConfig, Draft, templateDefaultOptions } from "../draft";
import { each } from "../each";
import { eachSchema } from "../eachSchema";
import { JsonSchema } from "../types";
import { resolveAllOf } from "../features/allOf";
import { resolveAnyOf } from "../features/anyOf";
import { resolveOneOf } from "../features/oneOf";

const draft04Config: DraftConfig = {
    typeKeywords: {
        array: ["allOf", "anyOf", "enum", "items", "maxItems", "minItems", "not", "oneOf", "uniqueItems"],
        boolean: ["enum", "not", "allOf", "anyOf", "oneOf"],
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
        string: ["allOf", "anyOf", "enum", "format", "maxLength", "minLength", "not", "oneOf", "pattern"],
        number: ["allOf", "anyOf", "enum", "format", "maximum", "minimum", "multipleOf", "not", "oneOf"],
        null: ["allOf", "anyOf", "enum", "format", "not", "oneOf"]
    },
    createNode,
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
    validate,

    templateDefaultOptions
};

class Draft04 extends Draft {
    constructor(schema?: JsonSchema, config: Partial<DraftConfig> = {}) {
        super(merge(draft04Config, config), schema);
    }
}

export { Draft04, draft04Config };
