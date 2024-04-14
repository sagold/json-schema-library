import { JsonError } from "./types";
import { SchemaNode } from "./schemaNode";
/**
 * Validates data with json schema
 *
 * @param draft - validator
 * @param value - value to validate
 * @param [schema] - json schema, defaults to rootSchema
 * @param [pointer] - json pointer pointing to value (used for error-messages only)
 * @return list of errors or empty
 */
export default function validate(node: SchemaNode, value: unknown): Array<JsonError>;
