import copy from "../utils/copy";
import { mergeSchema } from "../mergeSchema";
import errors from "../validation/errors";
import { JSONSchema, JSONPointer, JSONValidator, JSONError } from "../types";
import { Draft } from "../draft";

/**
 * @returns merged anyOf subschemas which are valid to the given input data.
 */
export function resolveAnyOfSchema(draft: Draft, schema: JSONSchema, data: unknown) {
    if (!Array.isArray(schema.anyOf) || schema.anyOf.length === 0) {
        return;
    }
    let resolvedSchema: JSONSchema;
    schema.anyOf.forEach((any: JSONSchema) => {
        if (draft.isValid(data, any)) {
            resolvedSchema = resolvedSchema ? mergeSchema(resolvedSchema, any) : any;
        }
    });
    return resolvedSchema;
}

/**
 * @returns extended input schema with valid anyOf subschemas or JSONError if
 * no anyOf schema matches input data
 */
export function resolveAnyOf(
    draft: Draft,
    data: any,
    schema: JSONSchema = draft.rootSchema,
    pointer: JSONPointer = "#"
): JSONSchema | JSONError {
    let found = false;
    let mergedSchema = copy(schema);
    for (let i = 0; i < schema.anyOf.length; i += 1) {
        const anyOfSchema = draft.resolveRef(schema.anyOf[i]);
        if (draft.isValid(data, schema.anyOf[i], pointer)) {
            found = true;
            mergedSchema = mergeSchema(mergedSchema, anyOfSchema);
        }
    }

    if (found === false) {
        return errors.anyOfError({ value: data, pointer, anyOf: JSON.stringify(schema.anyOf) });
    }

    delete mergedSchema.anyOf;
    return mergedSchema;
}

const validateAnyOf: JSONValidator = (draft, schema, value, pointer) => {
    if (Array.isArray(schema.anyOf) === false) {
        return undefined;
    }

    for (let i = 0; i < schema.anyOf.length; i += 1) {
        if (draft.isValid(value, schema.anyOf[i])) {
            return undefined;
        }
    }

    return draft.errors.anyOfError({ anyOf: schema.anyOf, value, pointer });
};

export { validateAnyOf };
