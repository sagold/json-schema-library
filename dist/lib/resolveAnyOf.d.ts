import { JSONSchema, JSONPointer, JSONError } from "./types";
import { Draft as Core } from "./draft";
export default function resolveAnyOf(core: Core, data: any, schema?: JSONSchema, pointer?: JSONPointer): JSONSchema | JSONError;
