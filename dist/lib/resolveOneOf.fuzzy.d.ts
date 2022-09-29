import { JSONSchema, JSONPointer, JSONError } from "./types";
import { Draft as Core } from "./draft";
/**
 * Selects and returns a oneOf schema for the given data
 *
 * @param core
 * @param data
 * @param [schema] - current json schema containing property oneOf
 * @param [pointer] - json pointer to data
 * @return oneOf schema or an error
 */
export default function resolveOneOf(core: Core, data: any, schema?: JSONSchema, pointer?: JSONPointer): JSONSchema | JSONError;
