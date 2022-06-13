import { JSONSchema, JSONPointer } from "./types";
export interface OnSchema {
    (schema: JSONSchema, pointer: JSONPointer): void;
}
export default function eachSchema(schema: JSONSchema, callback: OnSchema, pointer?: JSONPointer): void;
