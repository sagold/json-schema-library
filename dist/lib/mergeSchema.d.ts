import { JsonSchema } from "./types";
/**
 * merges to two json schema. In case of conflicts, will use overwrite first
 * schema or directly return first json schema.
 */
export declare function _mergeSchema(a: JsonSchema, b: JsonSchema): JsonSchema;
export declare function mergeSchema<T extends JsonSchema>(a: T, b: T): T;
export declare function mergeSchema2(a: unknown, b: unknown, property?: string): unknown;
