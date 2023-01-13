import { JSONSchema, JSONValidator } from "../types";
import { Draft } from "../draft";
/**
 * returns if-then-else as a json schema. does not merge with input
 * json schema. you probably will need to do so to correctly resolve
 * references.
 *
 * @returns json schema defined by if-then-else or undefined
 */
export declare function resolveIfSchema(draft: Draft, schema: JSONSchema, data: unknown): JSONSchema | undefined;
/**
 * steps into if-then-else
 * @returns json schema or undefined if 'key' is not defined
 */
export declare function stepIntoIf(draft: Draft, key: string, schema: JSONSchema, data: unknown, pointer: string): JSONSchema | undefined;
/**
 * @returns validation result of it-then-else schema
 */
declare const validateIf: JSONValidator;
export { validateIf };
