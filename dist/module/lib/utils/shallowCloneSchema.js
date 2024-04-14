export function shallowCloneSchemaNode(node) {
    const result = { ...node };
    Object.defineProperty(result, "getOneOfOrigin", { enumerable: false, value: node.getOneOfOrigin });
    return result;
}
