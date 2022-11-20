import { JSONSchema, JSONPointer } from "./types";
import { Draft } from "./draft";
/**
 * Returns the json-schema of a data-json-pointer.
 *
 *  Notes
 *      - Uses draft.step to walk through data and schema
 *
 * @param draft
 * @param pointer - json pointer in data to get the json schema for
 * @param [data] - the data object, which includes the json pointers value. This is optional, as
 *    long as no oneOf, anyOf, etc statement is part of the pointers schema
 * @param [schema] - the json schema to iterate. Defaults to draft.rootSchema
 * @return json schema object of the json-pointer or an error
 */
export default function getSchema(draft: Draft, pointer: JSONPointer, data?: unknown, schema?: JSONSchema): JSONSchema;
