/**
 * @draft-04
 */
import { JsonSchema, JsonValidator, JsonError } from "../types";
import { Draft } from "../draft";
/**
 * resolves schema
 * when complete this will have much duplication to step.object etc
 */
export declare function resolveSchema(draft: Draft, schemaToResolve: JsonSchema, data: unknown): JsonSchema;
export declare function resolveAllOf(draft: Draft, data: any, schema?: JsonSchema): JsonSchema | JsonError;
/**
 * @attention: subschemas have to be resolved upfront (e.g. if-else that do not apply)
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
