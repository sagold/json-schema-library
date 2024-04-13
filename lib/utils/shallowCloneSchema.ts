import { JsonSchema } from "../types";

export function shallowCloneSchemaNode(node: JsonSchema) {
    const result = { ...node };
    Object.defineProperty(result, "getOneOfOrigin", { enumerable: false, value: node.getOneOfOrigin });
    return result;
}
