import gp, { JsonPath } from "@sagold/json-pointer";
import { JsonSchema, JsonPointer, isJsonError, JsonError } from "./types";
import { Draft } from "./draft";

const emptyObject = {} as const;

export type GetSchemaOptions = {
    /* path to data location for the requested json-schema. Default to root-pointer '#' */
    pointer?: JsonPointer;
    /* the data object, which includes the json pointers value. This is optional,
    as long as no oneOf, anyOf, etc statement is part of the pointers schema */
    data?: unknown;
    /* the json-schema to iterate. Defaults to draft.rootSchema */
    schema?: JsonSchema;
    /* returns an error `schema-warning` for valid properties missing a
    json-schema definition. Default to false */
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
export default function getSchema(draft: Draft, options: GetSchemaOptions = emptyObject) {
    const { pointer = "#", data, schema = draft.rootSchema, withSchemaWarning = false } = options;
    const path = gp.split(pointer);
    const result = _getSchema(draft, draft.resolveRef(schema), path, "#", data);
    if (!withSchemaWarning && result?.code === "schema-warning") {
        return undefined;
    }
    return result;
}

function _getSchema(
    draft: Draft,
    schema: JsonSchema,
    path: JsonPath,
    pointer: JsonPointer,
    data: unknown = emptyObject
): JsonSchema | JsonError {
    if (path.length === 0) {
        return draft.resolveRef(schema);
    }

    const key = path.shift(); // step key
    schema = draft.step(key, schema, data, pointer); // step schema
    if (isJsonError(schema)) {
        return schema;
    }
    // @ts-expect-error data
    data = data[key]; // step data
    return _getSchema(draft, schema, path, `${pointer}/${key}`, data);
}
