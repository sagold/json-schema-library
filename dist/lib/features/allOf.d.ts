import { JSONSchema, JSONValidator } from "../types";
import { Draft } from "../draft";
/**
 * returns allOf as a json schema. does not merge with input
 * json schema. you probably will need to do so to correctly resolve
 * references.
 *
 * @returns json schema defined by allOf or undefined
 */
export declare function resolveAllOfSchema(draft: Draft, schema: JSONSchema, data: unknown): JSONSchema | undefined;
declare const validateAllOf: JSONValidator;
export { validateAllOf };
