import { compileSchema } from "../compileSchema";
import { JsonSchema } from "../types";

export function shouldReturnTypeNode(schema: JsonSchema) {
    const root = compileSchema(schema);
    const { node: childNode, error } = root.getNode("/test", undefined, { createSchema: true });
    // getNode should return NodeOrError
}

export function shouldReturnTypeNodeOrUndefined(schema: JsonSchema) {
    const root = compileSchema(schema);
    const { node: childNode, error } = root.getNode("/test");
    // getNode should return OptionalNodeOrError
}
