import { Draft } from "./draft";
export type JsonSchema = {
    [p: string]: any;
};
export type SchemaScope = {
    pointer: string;
    history: JsonSchema[];
};
export type JsonPointer = string;
export type ErrorData<T extends Record<string, unknown> = {
    [p: string]: unknown;
}> = T & {
    pointer: string;
    schema: JsonSchema;
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
export declare function isJsonError(error: any): error is JsonError;
/**
 * create next node based from current node
 */
declare function next(schema: JsonError, key?: string | number): JsonError;
declare function next(schema: JsonSchema, key?: string | number): SchemaNode;
export type SchemaNode = {
    draft: Draft;
    pointer: string;
    schema: JsonSchema;
    path: JsonSchema[];
    next: typeof next;
};
export declare function isSchemaNode(value: unknown): value is SchemaNode;
export declare function createNode(draft: Draft, schema: JsonSchema, pointer?: string): SchemaNode;
export interface JsonValidator {
    (node: SchemaNode, value: unknown): void | undefined | JsonError | JsonError[] | JsonError[][];
}
export interface JsonTypeValidator {
    (node: SchemaNode, value: unknown): Array<void | undefined | JsonError | JsonError[] | JsonError[][]>;
}
export {};
