/**
 * @draft-04
 */
import { JsonSchema, JsonValidator, JsonError } from "../types";
import { Draft } from "../draft";
export declare function resolveAllOf(draft: Draft, data: any, schema?: JsonSchema): JsonSchema | JsonError;
/**
 * Merge all allOf sub schema into a single schema. Returns undefined for
 * missing allOf definition.
 *
 * @returns json schema defined by allOf or undefined
 */
export declare function mergeAllOfSchema(draft: Draft, schema: JsonSchema): JsonSchema | undefined;
/**
 * validate allOf definition for given input data
 */
declare const validateAllOf: JsonValidator;
export { validateAllOf };
