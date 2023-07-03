import { Draft } from "./draft";
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
export declare function each(draft: Draft, data: any, callback: EachCallback, schema?: JsonSchema, pointer?: JsonPointer): void;
