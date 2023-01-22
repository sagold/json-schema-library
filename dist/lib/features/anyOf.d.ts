import { JsonSchema, JsonPointer, JsonValidator, JsonError } from "../types";
import { Draft } from "../draft";
/**
 * returns merged all valid anyOf subschemas of the given input data. Does not
 * merge with rest input schema.
 *
 * @returns merged anyOf subschemas which are valid to the given input data.
 */
export declare function resolveAnyOfSchema(draft: Draft, schema: JsonSchema, data: unknown): JsonSchema;
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
