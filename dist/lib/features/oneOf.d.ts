import { Draft } from "../draft";
import { JsonSchema, JsonPointer, JsonError, JsonValidator } from "../types";
/**
 * Selects and returns a oneOf schema for the given data
 *
 * @param draft - validator
 * @param data
 * @param schema - current json schema containing property oneOf
 * @param pointer - json pointer to data
 * @return oneOf schema or an error
 */
export declare function resolveOneOf(draft: Draft, data: any, schema?: JsonSchema, pointer?: JsonPointer): JsonSchema | JsonError;
/**
 * Selects and returns a oneOf schema for the given data
 *
 * @param draft
 * @param data
 * @param [schema] - current json schema containing property oneOf
 * @param [pointer] - json pointer to data
 * @return oneOf schema or an error
 */
export declare function resolveOneOfFuzzy(draft: Draft, data: any, schema?: JsonSchema, pointer?: JsonPointer): JsonSchema | JsonError;
/**
 * validates oneOf definition for given input data
 */
declare const validateOneOf: JsonValidator;
export { validateOneOf };
