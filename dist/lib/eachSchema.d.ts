import { JsonSchema, JsonPointer } from "./types";
export type EachSchemaCallback = (schema: JsonSchema, pointer: JsonPointer) => void;
export declare function eachSchema(schema: JsonSchema, callback: EachSchemaCallback, pointer?: JsonPointer): void;
