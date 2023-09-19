/**
 * @draft-04
 */
import { mergeSchema } from "../mergeSchema";
import { JsonSchema, JsonPointer, JsonValidator, JsonError } from "../types";
import { Draft } from "../draft";
import { omit } from "../utils/omit";

/**
 * returns merged schema of all valid anyOf subschemas for the given input data.
 * Does not merge with rest input schema.
 *
 * @returns merged anyOf subschemas which are valid to the given input data.
 */
export function mergeValidAnyOfSchema(draft: Draft, schema: JsonSchema, data: unknown) {
    if (!Array.isArray(schema.anyOf) || schema.anyOf.length === 0) {
        return;
    }

    let resolvedSchema: JsonSchema;
    schema.anyOf.forEach((anySchema: JsonSchema) => {
        anySchema = draft.resolveRef(anySchema);
        if (draft.isValid(data, anySchema)) {
            resolvedSchema = resolvedSchema ? mergeSchema(resolvedSchema, anySchema) : anySchema;
        }
    });
    return resolvedSchema;
}

/**
 * @returns extended input schema with valid anyOf subschemas or JsonError if
 * no anyOf schema matches input data
 */
export function resolveAnyOf(
    draft: Draft,
    data: any,
    schema: JsonSchema = draft.rootSchema,
    pointer: JsonPointer = "#"
): JsonSchema | JsonError {
    const { anyOf } = schema;
    if (!Array.isArray(anyOf) || anyOf.length === 0) {
        return schema;
    }

    const resolvedSchema = mergeValidAnyOfSchema(draft, schema, data);
    if (resolvedSchema == null) {
        return draft.errors.anyOfError({ pointer, schema, value: data, anyOf: JSON.stringify(anyOf) });
    }
    const mergedSchema = mergeSchema(schema, resolvedSchema);
    return omit(mergedSchema, "anyOf");
}

/**
 * validate anyOf definition for given input data
 */
const validateAnyOf: JsonValidator = (draft, schema, value, pointer) => {
    if (!Array.isArray(schema.anyOf) || schema.anyOf.length === 0) {
        return undefined;
    }

    for (let i = 0; i < schema.anyOf.length; i += 1) {
        if (draft.isValid(value, schema.anyOf[i])) {
            return undefined;
        }
    }
    return draft.errors.anyOfError({ pointer, schema, value, anyOf: schema.anyOf });
};

export { validateAnyOf };
