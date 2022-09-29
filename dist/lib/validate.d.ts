import { JSONSchema, JSONPointer, JSONError } from "./types";
import { Draft as Core } from "./draft";
/**
 * Validate data by a json schema
 *
 * @param core - validator
 * @param value - value to validate
 * @param [schema] - json schema, defaults to rootSchema
 * @param [pointer] - json pointer pointing to value (used for error-messages only)
 * @return list of errors or empty
 */
export default function validate(core: Core, value: unknown, schema?: JSONSchema, pointer?: JSONPointer): Array<JSONError>;
