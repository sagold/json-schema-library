import { JsonSchema, JsonPointer } from "./types";
import { Draft } from "./draft";
/**
 * reduces json schema by merging dynamic constructs like if-then-else,
 * dependencies, allOf, anyOf, oneOf, etc into a static json schema
 * omitting those properties.
 *
 * @returns input schema reduced by dynamic schema definitions for the given
 * input data
 */
export declare function reduceSchema(draft: Draft, schema: JsonSchema, data: unknown, pointer: JsonPointer): JsonSchema;
