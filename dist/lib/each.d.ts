import Core from "./cores/CoreInterface";
import { JSONSchema, JSONPointer } from "./types";
/**
 * Iterates over data, retrieving its schema
 *
 * @param core - validator
 * @param data - the data to iterate
 * @param callback - will be called with (schema, data, pointer) on each item
 * @param [schema] - the schema matching the data. Defaults to rootSchema
 * @param [pointer] - pointer to current data. Default to rootPointer
 */
export default function each(core: Core, data: any, callback: any, schema?: JSONSchema, pointer?: JSONPointer): void;
