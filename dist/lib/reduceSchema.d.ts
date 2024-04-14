import { SchemaNode } from "./schemaNode";
/**
 * reduces json schema by merging dynamic constructs like if-then-else,
 * dependencies, allOf, anyOf, oneOf, etc into a static json schema
 * omitting those properties.
 *
 * @returns input schema reduced by dynamic schema definitions for the given
 * input data
 */
export declare function reduceSchema(node: SchemaNode, data: unknown): SchemaNode | import("./types").JsonError;
