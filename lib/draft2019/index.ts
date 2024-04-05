import addRemoteSchema from "../addRemoteSchema";
import compileSchema from "../draft06/compile";
import { each } from "../each";
import { eachSchema } from "../eachSchema";
import ERRORS from "../validation/errors";
import FORMATS from "../validation/format";
import getSchema from "../getSchema";
import getTemplate from "../getTemplate";
import isValid from "../isValid";
import KEYWORDS from "./validation/keyword";
import merge from "../utils/merge";
import { resolveAllOf } from "../features/allOf";
import { resolveAnyOf } from "../features/anyOf";
import { resolveOneOf } from "../features/oneOf";
import createSchemaOf from "../createSchemaOf";
import getChildSchemaSelection from "../getChildSchemaSelection";
import step from "../step";
import TYPES from "../draft06/validation/type";
import validate from "../validate";
import { DraftConfig, Draft } from "../draft";
import { JsonSchema } from "../types";
import settings from "../config/settings";
// import resolveRef from "../resolveRef.merge"; // @attention we now merge refs?
import { mergeSchema } from "../mergeSchema";
function resolveRef(schema: JsonSchema, rootSchema: JsonSchema): JsonSchema {
    if (schema == null || schema.$ref == null) {
        return schema;
    }
    const resolvedSchema = rootSchema.getRef(schema);
    // @draft >= 2019-09 we now merge schemas?
    const mergedSchema = mergeSchema(schema, resolvedSchema);
    delete mergedSchema.$ref;
    // @todo the following might not be safe nor incomplete
    Object.defineProperty(mergedSchema, "__ref", { enumerable: false, value: schema.__ref });
    Object.defineProperty(mergedSchema, "getRoot", { enumerable: false, value: schema.getRoot });
    return mergedSchema;
}


const draft2019Config: DraftConfig = {
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
            "dependencies",
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
    constructor(schema?: JsonSchema, config: Partial<DraftConfig> = {}) {
        super(merge(draft2019Config, config), schema);
    }
}

export { Draft2019, draft2019Config };