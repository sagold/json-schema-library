import { JsonSchema, JsonPointer, JsonValidator, JsonError } from "../types";
import { Draft } from "../draft";
/**
 * returns merged schema of all valid anyOf subschemas for the given input data.
 * Does not merge with rest input schema.
 *
 * @returns merged anyOf subschemas which are valid to the given input data.
 */
export declare function mergeValidAnyOfSchema(draft: Draft, schema: JsonSchema, data: unknown): JsonSchema;
/**
 * @returns extended input schema with valid anyOf subschemas or JsonError if
 * no anyOf schema matches input data
 */
export declare function resolveAnyOf(draft: Draft, data: any, schema?: JsonSchema, pointer?: JsonPointer): JsonSchema | JsonError;
/**
 * validate anyOf definition for given input data
 */
declare const validateAnyOf: JsonValidator;
export { validateAnyOf };
