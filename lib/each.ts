import { Draft as Core } from "./draft";
import getTypeOf from "./getTypeOf";
import { JSONSchema, JSONPointer } from "./types";

export type EachCallback = (schema: JSONSchema, data: unknown, pointer: JSONPointer) => void;

/**
 * Iterates over data, retrieving its schema
 *
 * @param core - validator
 * @param data - the data to iterate
 * @param callback - will be called with (schema, data, pointer) on each item
 * @param [schema] - the schema matching the data. Defaults to rootSchema
 * @param [pointer] - pointer to current data. Default to rootPointer
 */
export function each(
    core: Core,
    data: any,
    callback: EachCallback,
    schema: JSONSchema = core.rootSchema,
    pointer: JSONPointer = "#"
) {
    schema = core.resolveRef(schema);
    callback(schema, data, pointer);
    const dataType = getTypeOf(data);

    if (dataType === "object") {
        Object.keys(data).forEach((key) => {
            const nextSchema = core.step(key, schema, data, pointer); // not save
            const next = data[key]; // save
            core.each(next, callback, nextSchema, `${pointer}/${key}`);
        });
    } else if (dataType === "array") {
        data.forEach((next: unknown, key: number) => {
            const nextSchema = core.step(key, schema, data, pointer);
            core.each(next, callback, nextSchema, `${pointer}/${key}`);
        });
    }
}
