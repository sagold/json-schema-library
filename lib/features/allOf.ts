/* draft-04 */
import { JSONSchema, JSONValidator, JSONError } from "../types";
import { Draft } from "../draft";
import { mergeSchema } from "../mergeSchema";

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
