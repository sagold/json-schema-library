import { JsonSchema, JsonValidator, JsonError, SchemaNode } from "../types";
import { Draft } from "../draft";
/**
 * returns merged schema of all valid anyOf subschemas for the given input data.
 * Does not merge with rest input schema.
 *
 * @returns merged anyOf subschemas which are valid to the given input data.
 */
export declare function mergeValidAnyOfSchema(draft: Draft, schema: JsonSchema, data: unknown): JsonSchema;
/**
 * @unused this function is only exposed via draft and not used otherwise
 * @returns extended input schema with valid anyOf subschemas or JsonError if
 * no anyOf schema matches input data
 */
export declare function resolveAnyOf(node: SchemaNode, data: any): SchemaNode | JsonError;
/**
 * validate anyOf definition for given input data
 */
export declare const validateAnyOf: JsonValidator;
