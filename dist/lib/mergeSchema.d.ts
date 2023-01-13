import { JSONSchema } from "./types";
/**
 * merges to two json schema. In case of conflicts, will use overwrite first
 * schema or directly return first json schema.
 */
export declare function mergeSchema(a: JSONSchema, b: JSONSchema): JSONSchema;
