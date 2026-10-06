import { BooleanSchema, isJsonError, JsonSchema, SchemaNode } from "./types";
import { SchemaNodeWithRequired, ValidationPath, ValidationReturnType } from "./Keyword";
import sanitizeErrors from "./utils/sanitizeErrors";

export function validateNode(node: SchemaNode, data: unknown, pointer: string, path: ValidationPath) {
    if (isJsonError(node)) {
        return [node];
    }
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
        // Each keyword owns its branch, including entries appended by reference resolution.
        const result = validate({
            node: node as SchemaNodeWithRequired<keyof SchemaNode>,
            data,
            pointer,
            path: [...path, { pointer, node }]
        });
        if (Array.isArray(result)) {
            errors.push(...result);
        } else if (result) {
            errors.push(result);
        }
    }
    return sanitizeErrors(errors);
}
