import { Draft } from "./draft";
import getTypeOf from "./getTypeOf";
import { isObject } from "./utils/isObject";
import { JsonSchema, JsonError, isJsonError } from "./types";

/**
 * create next node based from current node
 */
function next(schema: JsonError, key?: string | number): JsonError;
function next(schema: JsonSchema, key?: string | number): SchemaNode;
function next(schema: JsonSchema, key?: string | number) {
    if (isJsonError(schema)) {
        return schema;
    }

    if (schema == null) {
        throw new Error(`undefined schema`);
    }

    if (!isObject(schema) && getTypeOf(schema) !== "boolean") {
        throw new Error(`bad schema type ${getTypeOf(schema)}`);
    }

    const node = this as SchemaNode;
    return {
        ...node,
        pointer: key ? `${node.pointer}/${key}` : node.pointer,
        schema,
        path: [...node.path, node.schema]
    };
}

export type SchemaNode = {
    draft: Draft,
    pointer: string,
    schema: JsonSchema,
    path: JsonSchema[],
    next: typeof next
}

export function isSchemaNode(value: unknown): value is SchemaNode {
    // @ts-expect-error unknown object
    return isObject(value) && value.next && value.path && value.draft;
}

export function createNode(draft: Draft, schema: JsonSchema, pointer: string = "#"): SchemaNode {
    return {
        draft,
        pointer,
        schema,
        path: [],
        next
    }
}
