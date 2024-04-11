import { Draft } from "./draft";
import getTypeOf from "./getTypeOf";
import { isObject } from "./utils/isObject";

export type JsonSchema = { [p: string]: any };

export type SchemaScope = {
    pointer: string;
    history: JsonSchema[]
}

export type JsonPointer = string;
export type ErrorData<T extends Record<string, unknown> = { [p: string]: unknown }> = T & {
    /* json-pointer to location of error */
    pointer: string;
    /* json-schema of error location */
    schema: JsonSchema;
    /* value: data in error location */
    value: unknown;
};

export type JsonError<T extends ErrorData = ErrorData> = {
    type: "error";
    name: string;
    code: string;
    message: string;
    data: T;
    [p: string]: unknown;
};

/**
 * ts type guard for json error
 * @returns true if passed type is a JsonError
 */
export function isJsonError(error: any): error is JsonError {
    return error?.type === "error";
}

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

export interface JsonValidator {
    (node: SchemaNode, value: unknown):
        | void
        | undefined
        | JsonError
        | JsonError[]
        | JsonError[][];
}

export interface JsonTypeValidator {
    (node: SchemaNode, value: unknown): Array<
        void | undefined | JsonError | JsonError[] | JsonError[][]
    >;
}
