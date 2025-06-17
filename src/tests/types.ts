import { compileSchema } from "../compileSchema.js";
import { JsonSchema } from "../types.js";

export function shouldReturnTypeNode(schema: JsonSchema) {
    const root = compileSchema(schema);
    // eslint-disable-next-line
    const { node: childNode, error } = root.getNode("/test", undefined, { createSchema: true });
    // getNode should return NodeOrError
}

export function shouldReturnTypeNodeOrUndefined(schema: JsonSchema) {
    const root = compileSchema(schema);
    // eslint-disable-next-line
    const { node: childNode, error } = root.getNode("/test");
    // getNode should return OptionalNodeOrError
}
