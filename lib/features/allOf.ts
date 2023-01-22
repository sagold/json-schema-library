/* draft-04 */
import { JSONSchema, JSONValidator, JSONError } from "../types";
import { Draft } from "../draft";
import { mergeSchema } from "../mergeSchema";

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
function resolveSchema(draft: Draft, schemaToResolve: JSONSchema, data: unknown): JSONSchema {
    const schema = { ...(draft.resolveRef(schemaToResolve) ?? {}) };
    const ifSchema = resolveIfSchema(draft, schema, data);
    if (ifSchema) {
        return ifSchema;
    }
    delete schema.if;
    delete schema.then;
    delete schema.else;
    return schema;
}

export function resolveAllOf(
    draft: Draft,
    data: any,
    schema: JSONSchema = draft.rootSchema
): JSONSchema | JSONError {
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
 * returns allOf as a json schema. does not merge with input
 * json schema. you probably will need to do so to correctly resolve
 * references.
 *
 * @returns json schema defined by allOf or undefined
 */
export function resolveAllOfSchema(
    draft: Draft,
    schema: JSONSchema,
    data: unknown
): JSONSchema | undefined {
    const { allOf } = schema;
    if (!Array.isArray(allOf) || allOf.length === 0) {
        return;
    }
    let resolvedSchema: JSONSchema = {};
    allOf.forEach((subschema) => {
        resolvedSchema = mergeSchema(resolvedSchema, draft.resolveRef(subschema));
    });
    // resolvedSchema.type = resolvedSchema.type || schema.type;
    return resolvedSchema;
}

const validateAllOf: JSONValidator = (core, schema, value, pointer) => {
    const { allOf } = schema;
    if (!Array.isArray(allOf) || allOf.length === 0) {
        return;
    }
    const errors: JSONError[] = [];
    schema.allOf.forEach((subSchema: JSONSchema) => {
        errors.push(...core.validate(value, subSchema, pointer));
    });
    return errors;
};

export { validateAllOf };
