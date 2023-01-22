/* draft-04 */
import { JsonSchema, JsonValidator, JsonError } from "../types";
import { Draft } from "../draft";
import { mergeSchema } from "../mergeSchema";
import { omit } from "../utils/omit";

/**
 * resolveAllOf is tricky:
 *
 * resolve all merges all schemas altough each schema in the list must be used
 * for validation. But to use this as a template schema to create data and a
 * resolved schema, structural data must be merged. Currently, it is merged in
 * all case, but separately validated and resolved. This will break at some
 * point, requiring us to be more specific on our current intent (validation
 * vs get (resolved) schema)
 */
import copy from "../utils/copy";
import { mergeArraysUnique } from "../utils/merge";
import { resolveIfSchema } from "./if";

/**
 * resolves schema
 * when complete this will have much duplication to step.object etc
 */
function resolveSchema(draft: Draft, schemaToResolve: JsonSchema, data: unknown): JsonSchema {
    const schema = { ...(draft.resolveRef(schemaToResolve) ?? {}) };
    const ifSchema = resolveIfSchema(draft, schema, data);
    if (ifSchema) {
        return ifSchema;
    }
    return omit(schema, "if", "then", "else");
}

export function resolveAllOf(
    draft: Draft,
    data: any,
    schema: JsonSchema = draft.rootSchema
): JsonSchema | JsonError {
    let mergedSchema = copy(schema);
    for (let i = 0; i < schema.allOf.length; i += 1) {
        const allOfSchema = resolveSchema(draft, schema.allOf[i], data);
        mergedSchema = mergeArraysUnique(mergedSchema, allOfSchema);
        data = draft.getTemplate(data, mergedSchema);
    }
    delete mergedSchema.allOf;
    return mergedSchema;
}

/**
 * returns allOf as a json schema. does not merge with input json schema. you
 * probably will need to do so to correctly resolve references.
 *
 * @returns json schema defined by allOf or undefined
 */
export function resolveAllOfSchema(
    draft: Draft,
    schema: JsonSchema,
    data: unknown
): JsonSchema | undefined {
    const { allOf } = schema;
    if (!Array.isArray(allOf) || allOf.length === 0) {
        return;
    }
    let resolvedSchema: JsonSchema = {};
    allOf.forEach((subschema) => {
        resolvedSchema = mergeSchema(resolvedSchema, draft.resolveRef(subschema));
    });
    // resolvedSchema.type = resolvedSchema.type || schema.type;
    return resolvedSchema;
}

/**
 * validate allOf definition for given input data
 */
const validateAllOf: JsonValidator = (core, schema, value, pointer) => {
    const { allOf } = schema;
    if (!Array.isArray(allOf) || allOf.length === 0) {
        return;
    }
    const errors: JsonError[] = [];
    schema.allOf.forEach((subSchema: JsonSchema) => {
        errors.push(...core.validate(value, subSchema, pointer));
    });
    return errors;
};

export { validateAllOf };
