import { JsonSchema, JsonValidator } from "../types";
import { Draft } from "../draft";
/**
 * returns if-then-else as a json schema. does not merge with input
 * json schema. you probably will need to do so to correctly resolve
 * references.
 *
 * @returns json schema defined by if-then-else or undefined
 */
export declare function resolveIfSchema(draft: Draft, schema: JsonSchema, data: unknown): JsonSchema | undefined;
/**
 * steps into if-then-else
 * @returns json schema or undefined if 'key' is not defined
 */
/**
 * @returns validation result of it-then-else schema
 */
declare const validateIf: JsonValidator;
export { validateIf };
