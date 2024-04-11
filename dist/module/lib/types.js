import getTypeOf from "./getTypeOf";
import { isObject } from "./utils/isObject";
/**
 * ts type guard for json error
 * @returns true if passed type is a JsonError
 */
export function isJsonError(error) {
    return (error === null || error === void 0 ? void 0 : error.type) === "error";
}
function next(schema, key) {
    if (isJsonError(schema)) {
        return schema;
    }
    if (schema == null) {
        throw new Error(`undefined schema`);
    }
    if (!isObject(schema) && getTypeOf(schema) !== "boolean") {
        throw new Error(`bad schema type ${getTypeOf(schema)}`);
    }
    const node = this;
    return {
        ...node,
        pointer: key ? `${node.pointer}/${key}` : node.pointer,
        schema,
        path: [...node.path, node.schema]
    };
}
export function isSchemaNode(value) {
    // @ts-expect-error unknown object
    return isObject(value) && value.next && value.path && value.draft;
}
export function createNode(draft, schema, pointer = "#") {
    return {
        draft,
        pointer,
        schema,
        path: [],
        next
    };
}
