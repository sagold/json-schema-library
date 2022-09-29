import { JSONSchema, JSONPointer, JSONError } from "./types";
import Core from "./cores/CoreInterface";
export default function resolveAnyOf(core: Core, data: any, schema?: JSONSchema, pointer?: JSONPointer): JSONSchema | JSONError;
