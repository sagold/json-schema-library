import { JsonSchema } from "../types";

export function shallowCloneSchemaNode(node: JsonSchema) {
    const result = { ...node };
    Object.defineProperty(result, "__compiled", { enumerable: false, value: true });
    Object.defineProperty(result, "__ref", { enumerable: false, value: node.__ref });
    Object.defineProperty(result, "getOneOfOrigin", { enumerable: false, value: node.getOneOfOrigin });
    Object.defineProperty(result, "getRoot", { enumerable: false, value: node.getRoot });
    return result;
}
