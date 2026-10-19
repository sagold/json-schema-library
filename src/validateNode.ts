import { BooleanSchema, isJsonAnnotation, isJsonError, JsonSchema, SchemaNode } from "./types";
import { SchemaNodeWithRequired, ValidationPath, ValidationReturnType } from "./Keyword";
import sanitizeErrors from "./utils/sanitizeErrors";

/**
 * Test if the data is valid to the given node
 *
 * @returns true, if the validation does not contain errors
 */
export function isValid(node: SchemaNode, data: unknown, pointer: string, path: ValidationPath) {
    return validateNode(node, data, pointer, path).every(isJsonAnnotation);
}

/**
 * Validate data using the given node.
 *
 * @returns List of validation errors and annotations
 */
export function validateNode(node: SchemaNode, data: unknown, pointer: string, path: ValidationPath) {
    if (isJsonError(node)) {
        return [node];
    }
    path.push({ pointer, node });
    const schema = node.schema as BooleanSchema | JsonSchema;
    if (schema === true) {
        return [];
    }
    if (schema === false) {
        return [
            node.createError("invalid-data-error", {
                value: data,
                pointer,
                schema: node.schema
            })
        ];
    }
    const errors: ValidationReturnType = [];
    for (const validate of node.validators) {
        const result = validate({ node: node as SchemaNodeWithRequired<keyof SchemaNode>, data, pointer, path });
        if (Array.isArray(result)) {
            errors.push(...result);
        } else if (result) {
            errors.push(result);
        }
    }
    return sanitizeErrors(errors);
}
