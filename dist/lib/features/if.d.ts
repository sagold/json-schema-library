/**
 * @draft-07
 */
import { JsonError, JsonValidator, SchemaNode } from "../types";
/**
 * returns if-then-else as a json schema. does not merge with input
 * json schema. you probably will need to do so to correctly resolve
 * references.
 *
 * @returns json schema defined by if-then-else or undefined
 */
export declare function resolveIfSchema(node: SchemaNode, data: unknown): SchemaNode | JsonError | undefined;
/**
 * @returns validation result of it-then-else schema
 */
declare const validateIf: JsonValidator;
export { validateIf };
