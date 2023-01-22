import { Draft } from "./draft";
import getTypeOf from "./getTypeOf";
import { JsonSchema, JsonPointer } from "./types";

export type EachCallback = (schema: JsonSchema, data: unknown, pointer: JsonPointer) => void;

/**
 * Iterates over data, retrieving its schema
 *
 * @param draft - validator
 * @param data - the data to iterate
 * @param callback - will be called with (schema, data, pointer) on each item
 * @param [schema] - the schema matching the data. Defaults to rootSchema
 * @param [pointer] - pointer to current data. Default to rootPointer
 */
export function each(
    draft: Draft,
    data: any,
    callback: EachCallback,
    schema: JsonSchema = draft.rootSchema,
    pointer: JsonPointer = "#"
) {
    schema = draft.resolveRef(schema);
    callback(schema, data, pointer);
    const dataType = getTypeOf(data);

    if (dataType === "object") {
        Object.keys(data).forEach((key) => {
            const nextSchema = draft.step(key, schema, data, pointer); // not save
            const next = data[key]; // save
            draft.each(next, callback, nextSchema, `${pointer}/${key}`);
        });
    } else if (dataType === "array") {
        data.forEach((next: unknown, key: number) => {
            const nextSchema = draft.step(key, schema, data, pointer);
            draft.each(next, callback, nextSchema, `${pointer}/${key}`);
        });
    }
}
