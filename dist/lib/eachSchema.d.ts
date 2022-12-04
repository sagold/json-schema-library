import { JSONSchema, JSONPointer } from "./types";
export type EachSchemaCallback = (schema: JSONSchema, pointer: JSONPointer) => void;
export declare function eachSchema(schema: JSONSchema, callback: EachSchemaCallback, pointer?: JSONPointer): void;
