import { JSONSchema, JSONPointer, JSONError } from "./types";
import { Draft } from "./draft";
export default function resolveAllOf(draft: Draft, data: any, schema?: JSONSchema, pointer?: JSONPointer): JSONSchema | JSONError;
