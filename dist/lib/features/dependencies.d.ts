/**
 * @draft-06
 */
import { JsonSchema, JsonValidator } from "../types";
import { Draft } from "../draft";
/**
 * returns dependencies as an object json schema. does not merge with input
 * json schema. you probably will need to do so to correctly resolve
 * references.
 *
 * @returns merged json schema defined by dependencies or undefined
 */
export declare function resolveDependencies(draft: Draft, schema: JsonSchema, data: unknown): JsonSchema | undefined;
/**
 * validate dependencies definition for given input data
 */
declare const validateDependencies: JsonValidator;
export { validateDependencies };
