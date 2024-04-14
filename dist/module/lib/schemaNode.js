import getTypeOf from "./getTypeOf";
import { isObject } from "./utils/isObject";
import { isJsonError } from "./types";
import { mergeSchema } from "./mergeSchema";
function merge(schema, ...omit) {
    if (schema == null) {
        throw new Error(`undefined schema`);
    }
    const node = this;
    const mergedSchema = mergeSchema(node.schema, schema, ...omit);
    return { ...node, schema: mergedSchema, path: [...node.path, node.schema] };
}
function resolveRef() {
    const node = this;
    return node.draft.resolveRef(node);
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
    return { draft, pointer, schema, path: [], next, merge, resolveRef };
}
