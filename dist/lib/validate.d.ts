import { JsonSchema, JsonPointer, JsonError } from "./types";
import { Draft } from "./draft";
/**
 * Validates data with json schema
 *
 * @param draft - validator
 * @param value - value to validate
 * @param [schema] - json schema, defaults to rootSchema
 * @param [pointer] - json pointer pointing to value (used for error-messages only)
 * @return list of errors or empty
 */
export default function validate(draft: Draft, value: unknown, schema?: JsonSchema, pointer?: JsonPointer): Array<JsonError>;
