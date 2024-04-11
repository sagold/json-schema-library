/**
 * @draft-04
 */
import { mergeSchema } from "../mergeSchema";
import { JsonSchema, JsonValidator, JsonError, SchemaNode, createNode } from "../types";
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
        const node = createNode(draft, anySchema);
        anySchema = draft.resolveRef(node).schema;
        if (draft.isValid(data, anySchema)) {
            resolvedSchema = resolvedSchema ? mergeSchema(resolvedSchema, anySchema) : anySchema;
        }
    });
    return resolvedSchema;
}

/**
 * @unused this function is only exposed via draft and not used otherwise
 * @returns extended input schema with valid anyOf subschemas or JsonError if
 * no anyOf schema matches input data
 */
export function resolveAnyOf(node: SchemaNode, data: any): SchemaNode | JsonError {
    const { anyOf } = node.schema;
    if (!Array.isArray(anyOf) || anyOf.length === 0) {
        return node;
    }
    const resolvedSchema = mergeValidAnyOfSchema(node.draft, node.schema, data);
    if (resolvedSchema == null) {
        const { pointer, schema } = node;
        return node.draft.errors.anyOfError({ pointer, schema, value: data, anyOf: JSON.stringify(anyOf) });
    }
    const mergedSchema = mergeSchema(node.schema, resolvedSchema);
    return node.next(omit(mergedSchema, "anyOf"));
}

/**
 * validate anyOf definition for given input data
 */
export const validateAnyOf: JsonValidator = (node, value) => {
    const { draft, schema, pointer } = node;
    if (!Array.isArray(schema.anyOf) || schema.anyOf.length === 0) {
        return undefined;
    }
    // console.log("validate any of", pointer, value);
    for (let i = 0; i < schema.anyOf.length; i += 1) {
        const nextNode = draft.resolveRef(node.next(schema.anyOf[i] as JsonSchema));
        if (draft.validate(nextNode, value).length === 0) {
            return undefined;
        }
    }
    return draft.errors.anyOfError({ pointer, schema, value, anyOf: schema.anyOf });
};
