import { JsonSchema, JsonPointer } from "./types";
import { SchemaNode } from "./schemaNode";
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
export declare function each(schemaNode: SchemaNode, data: any, callback: EachCallback): void;
