import { Draft as Core } from "./draft";
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
export declare function each(core: Core, data: any, callback: EachCallback, schema?: JSONSchema, pointer?: JSONPointer): void;
