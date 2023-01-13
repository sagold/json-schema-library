import { JSONSchema } from "./types";
import { Draft } from "./draft";
/**
 * reduces json schema by merging dynamic constructs like if-then-else,
 * dependencies, allOf, anyOf, oneOf, etc into a static json schema
 * omitting those properties.
 *
 * @returns reduced json schema
 */
export declare function reduceSchema(draft: Draft, schema: JSONSchema, data: unknown): JSONSchema;
