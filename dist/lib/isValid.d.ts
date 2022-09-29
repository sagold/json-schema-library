import { JSONSchema, JSONPointer } from "./types";
import { Draft as Core } from "./draft";
/**
 * Test if the data is valid according to the given schema
 *
 * @param core - validator
 * @param value - value to validate
 * @param [schema] - json schema
 * @param [pointer] - json pointer pointing to value
 * @return if schema does match given value
 */
export default function isValid(core: Core, value: any, schema?: JSONSchema, pointer?: JSONPointer): boolean;
