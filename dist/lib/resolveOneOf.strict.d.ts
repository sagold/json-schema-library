import Core from "./cores/CoreInterface";
import { JSONSchema, JSONError, JSONPointer } from "./types";
/**
 * Selects and returns a oneOf schema for the given data
 *
 * @param core - validator
 * @param data
 * @param schema - current json schema containing property oneOf
 * @param pointer - json pointer to data
 * @return oneOf schema or an error
 */
export default function resolveOneOf(core: Core, data: any, schema?: JSONSchema, pointer?: JSONPointer): JSONSchema | JSONError;
