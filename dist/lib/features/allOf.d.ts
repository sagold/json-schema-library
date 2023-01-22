/**
 * @draft-04
 */
import { JsonSchema, JsonValidator, JsonError } from "../types";
import { Draft } from "../draft";
export declare function resolveAllOf(draft: Draft, data: any, schema?: JsonSchema): JsonSchema | JsonError;
/**
 * returns allOf as a json schema. does not merge with input json schema. you
 * probably will need to do so to correctly resolve references.
 *
 * @returns json schema defined by allOf or undefined
 */
export declare function resolveAllOfSchema(draft: Draft, schema: JsonSchema, data: unknown): JsonSchema | undefined;
/**
 * validate allOf definition for given input data
 */
declare const validateAllOf: JsonValidator;
export { validateAllOf };
