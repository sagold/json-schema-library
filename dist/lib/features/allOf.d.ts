/**
 * @draft-04
 */
import { SchemaNode } from "../schemaNode";
import { JsonSchema, JsonError } from "../types";
import { Draft } from "../draft";
import { JsonValidator } from "../validation/type";
/**
 * resolves schema
 * when complete this will have much duplication to step.object etc
 */
export declare function resolveSchema(node: SchemaNode, data: unknown): SchemaNode | JsonError;
export declare function resolveAllOf(node: SchemaNode, data: any): SchemaNode | JsonError;
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
