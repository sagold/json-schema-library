/**
 * @draft-04
 */
import { mergeSchema } from "../mergeSchema";
/**
 * returns merged schema of all valid anyOf subschemas for the given input data.
 * Does not merge with rest input schema.
 *
 * @returns merged anyOf subschemas which are valid to the given input data.
 */
export function mergeValidAnyOfSchema(node, data) {
    const { draft, schema } = node;
    if (!Array.isArray(schema.anyOf) || schema.anyOf.length === 0) {
        return;
    }
    let resolvedSchema;
    schema.anyOf.forEach((anySchema) => {
        const anyNode = draft.resolveRef(node.next(anySchema));
        if (draft.validate(anyNode, data).length === 0) {
            resolvedSchema = resolvedSchema ? mergeSchema(resolvedSchema, anyNode.schema) : anyNode.schema;
        }
    });
    if (resolvedSchema) {
        return node.next(resolvedSchema);
    }
}
/**
 * @unused this function is only exposed via draft and not used otherwise
 * @returns extended input schema with valid anyOf subschemas or JsonError if
 * no anyOf schema matches input data
 */
export function resolveAnyOf(node, data) {
    const { anyOf } = node.schema;
    if (!Array.isArray(anyOf) || anyOf.length === 0) {
        return node;
    }
    const resolvedNode = mergeValidAnyOfSchema(node, data);
    if (resolvedNode) {
        const { pointer, schema } = node;
        return node.draft.errors.anyOfError({ pointer, schema, value: data, anyOf: JSON.stringify(anyOf) });
    }
    return node.merge(resolvedNode.schema, "anyOf");
}
/**
 * validate anyOf definition for given input data
 */
export const validateAnyOf = (node, value) => {
    const { draft, schema, pointer } = node;
    if (!Array.isArray(schema.anyOf) || schema.anyOf.length === 0) {
        return undefined;
    }
    // console.log("validate any of", pointer, value);
    for (let i = 0; i < schema.anyOf.length; i += 1) {
        const nextNode = draft.resolveRef(node.next(schema.anyOf[i]));
        if (draft.validate(nextNode, value).length === 0) {
            return undefined;
        }
    }
    return draft.errors.anyOfError({ pointer, schema, value, anyOf: schema.anyOf });
};
