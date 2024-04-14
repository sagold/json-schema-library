import { JsonError } from "../types";
import { JsonValidator } from "../validation/type";
import { SchemaNode } from "../schemaNode";
/**
 * returns merged schema of all valid anyOf subschemas for the given input data.
 * Does not merge with rest input schema.
 *
 * @returns merged anyOf subschemas which are valid to the given input data.
 */
export declare function mergeValidAnyOfSchema(node: SchemaNode, data: unknown): SchemaNode;
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
