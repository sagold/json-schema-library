import { JsonSchema } from "../types";

export function shallowCloneSchemaNode(node: JsonSchema) {
    return { ...node };
}
