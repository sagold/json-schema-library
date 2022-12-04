import gp from "@sagold/json-pointer";
import { isJSONError } from "./types";
const emptyObject = {};
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
export default function getSchema(draft, pointer, data, schema = draft.rootSchema) {
    const frags = gp.split(pointer);
    schema = draft.resolveRef(schema);
    return _get(draft, schema, frags, pointer, data);
}
function _get(draft, schema, frags, pointer, data = emptyObject) {
    if (frags.length === 0) {
        return draft.resolveRef(schema);
    }
    const key = frags.shift(); // step key
    schema = draft.step(key, schema, data, pointer); // step schema
    if (isJSONError(schema)) {
        return schema;
    }
    // @ts-ignore
    data = data[key]; // step data
    return _get(draft, schema, frags, `${pointer}/${key}`, data);
}
