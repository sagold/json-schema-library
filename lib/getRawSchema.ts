import gp from "@sagold/json-pointer";
import { JsonSchema, JsonPointer, isJsonError } from "./types";
import { Draft } from "./draft";

/**
 * Returns the json-schema of a data-json-pointer without resolving data
 *
 *  Notes
 *      - Uses draft.step to walk through data and schema
 *
 * @param draft
 * @param pointer - json pointer in data to get the json schema for
 * @param [schema] - the json schema to iterate. Defaults to draft.rootSchema
 * @return json schema object of the json-pointer or an error
 */
export default function getRawSchema(
    draft: Draft,
    pointer: JsonPointer,
    schema: JsonSchema = draft.rootSchema,
): JsonSchema {
    const frags = gp.split(pointer);
    schema = draft.resolveRef(schema);
    return _get(draft, schema, frags, pointer);
}

function _get(
    draft: Draft,
    schema: JsonSchema,
    frags: Array<string>,
    pointer: JsonPointer,
): JsonSchema {
    if (frags.length === 0) {
        return draft.resolveRef(schema);
    }

    const key = frags.shift(); // step key
    schema = draft.step(key, schema, {}, pointer, true); // step schema
    if (isJsonError(schema)) {
        return schema;
    }
    return _get(draft, schema, frags, `${pointer}/${key}`);
}
