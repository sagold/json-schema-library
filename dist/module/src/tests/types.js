import { compileSchema } from "../compileSchema.js";
export function shouldReturnTypeNode(schema) {
    const root = compileSchema(schema);
    // eslint-disable-next-line
    const { node: childNode, error } = root.getNode("/test", undefined, { createSchema: true });
    // getNode should return NodeOrError
}
export function shouldReturnTypeNodeOrUndefined(schema) {
    const root = compileSchema(schema);
    // eslint-disable-next-line
    const { node: childNode, error } = root.getNode("/test");
    // getNode should return OptionalNodeOrError
}
