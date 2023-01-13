import { JSONSchema, JSONValidator } from "../types";
import { Draft } from "../draft";
/**
 * returns dependencies as an object json schema. does not merge with input
 * json schema. you probably will need to do so to correctly resolve
 * references.
 *
 * @returns merged json schema defined by dependencies or undefined
 */
export declare function resolveDependencies(draft: Draft, schema: JSONSchema, data: unknown): JSONSchema | undefined;
/**
 * steps into dependencies
 * @returns json schema or undefined if 'key' is not defined
 */
export declare function stepIntoDependencies(draft: Draft, key: string, schema: JSONSchema, data: unknown, pointer: string): JSONSchema;
declare const validateDependencies: JSONValidator;
export { validateDependencies };
