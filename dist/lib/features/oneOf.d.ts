import { JsonError } from "../types";
import { JsonValidator } from "../validation/type";
import { SchemaNode } from "../schemaNode";
/**
 * Selects and returns a oneOf schema for the given data
 *
 * @param draft - validator
 * @param data
 * @param schema - current json schema containing property oneOf
 * @param pointer - json pointer to data
 * @return oneOf schema or an error
 */
export declare function resolveOneOf(node: SchemaNode, data: any): SchemaNode | JsonError;
/**
 * Selects and returns a oneOf schema for the given data
 *
 * @param draft
 * @param data
 * @param [schema] - current json schema containing property oneOf
 * @param [pointer] - json pointer to data
 * @return oneOf schema or an error
 */
export declare function resolveOneOfFuzzy(node: SchemaNode, data: any): SchemaNode | JsonError;
/**
 * validates oneOf definition for given input data
 */
declare const validateOneOf: JsonValidator;
export { validateOneOf };
