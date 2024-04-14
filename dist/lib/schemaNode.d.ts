import { Draft } from "./draft";
import { JsonSchema, JsonError } from "./types";
declare function merge(schema: JsonSchema, ...omit: string[]): SchemaNode;
declare function resolveRef(): SchemaNode;
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
    merge: typeof merge;
    resolveRef: typeof resolveRef;
};
export declare function isSchemaNode(value: unknown): value is SchemaNode;
export declare function createNode(draft: Draft, schema: JsonSchema, pointer?: string): SchemaNode;
export {};
