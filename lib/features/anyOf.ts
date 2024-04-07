/**
 * @draft-04
 */
import { mergeSchema } from "../mergeSchema";
import { JsonSchema, JsonPointer, JsonValidator, JsonError } from "../types";
import { Draft } from "../draft";
import { omit } from "../utils/omit";
import Q from "../Q";

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
        if (draft.isValid(data, Q.addScope(anySchema, schema.__scope))) {
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
    // console.log("validate any of", pointer, value);
    for (let i = 0; i < schema.anyOf.length; i += 1) {
        const nextSchema = draft.resolveRef(schema.anyOf[i]);
        // @todo @recursiveRef here we create an intermediary scope that is required
        // this duplicates pointers and probably can be solved by resolving the root scope correctly
        const nextNode = Q.newScope(nextSchema, {
            pointer,
            history: [...schema.__scope.history]
        });
        if (draft.isValid(value, nextNode)) {
            return undefined;
        }
    }
    return draft.errors.anyOfError({ pointer, schema, value, anyOf: schema.anyOf });
};

export { validateAnyOf };
