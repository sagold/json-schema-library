import sanitizeErrors from "./utils/sanitizeErrors";
export function validateNode(node, data, pointer, path) {
    path === null || path === void 0 ? void 0 : path.push({ pointer, node });
    const schema = node.schema;
    if (schema === true) {
        return [];
    }
    if (schema === false) {
        return [
            node.errors.invalidDataError({
                value: data,
                pointer,
                schema: node.schema
            })
        ];
    }
    const errors = [];
    for (const validate of node.validators) {
        const result = validate({ node, data, pointer, path });
        if (Array.isArray(result)) {
            errors.push(...result);
        }
        else if (result) {
            errors.push(result);
        }
    }
    return sanitizeErrors(errors);
}
