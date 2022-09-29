import { JSONSchema, JSONPointer } from "./types";
export declare type EachSchemaCallback = (schema: JSONSchema, pointer: JSONPointer) => void;
export default function eachSchema(schema: JSONSchema, callback: EachSchemaCallback, pointer?: JSONPointer): void;
