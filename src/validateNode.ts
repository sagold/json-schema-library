import { BooleanSchema, JsonSchema, SchemaNode } from "./types";
import { ValidationPath, ValidationResult } from "./Keyword";
import sanitizeErrors from "./utils/sanitizeErrors";

export function validateNode(node: SchemaNode, data: unknown, pointer: string, path?: ValidationPath) {
    path?.push({ pointer, node });
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
    const errors: (undefined | ValidationResult | ValidationResult)[] = [];
    for (const validate of node.validators) {
        const result = validate({ node, data, pointer, path });
        if (Array.isArray(result)) {
            errors.push(...result);
        } else if (result) {
            errors.push(result);
        }
    }
    return sanitizeErrors(errors);
}
