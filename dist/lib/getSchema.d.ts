import { JsonSchema, JsonPointer } from "./types";
import { Draft } from "./draft";
export type GetSchemaOptions = {
    pointer?: JsonPointer;
    data?: unknown;
    schema?: JsonSchema;
    withSchemaWarning?: boolean;
};
/**
 * Returns the json-schema of a data-json-pointer.
 *
 * To resolve dynamic schema where the type of json-schema is evaluated by
 * its value, a data object has to be passed in options.
 *
 * Per default this function will return `undefined` for valid properties that
 * do not have a defined schema. Use the option `withSchemaWarning: true` to
 * receive an error with `code: schema-warning` containing the location of its
 * last evaluated json-schema.
 *
 * Notes
 *      - uses draft.step to walk through data and schema
 *
 * @param draft
 * @param pointer - json pointer in data to get the json schema for
 * @param [options.data] - the data object, which includes the json pointers value. This is optional, as
 *    long as no oneOf, anyOf, etc statement is part of the pointers schema
 * @param [options.schema] - the json schema to iterate. Defaults to draft.rootSchema
 * @param [options.withSchemaWarning] - if true returns an error instead of `undefined` for valid properties missing a schema definition
 * @return resolved json-schema object of requested json-pointer location or json-error
 */
export default function getSchema(draft: Draft, options?: GetSchemaOptions): JsonSchema;
