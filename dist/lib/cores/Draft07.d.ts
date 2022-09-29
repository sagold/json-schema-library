import CoreInterface from "./CoreInterface";
import { JSONSchema, JSONPointer } from "../types";
export default class Draft07Core extends CoreInterface {
    constructor(schema?: JSONSchema);
    get rootSchema(): JSONSchema;
    set rootSchema(rootSchema: JSONSchema);
    each(data: any, callback: any, schema?: JSONSchema, pointer?: JSONPointer): void;
    validate(data: any, schema?: JSONSchema, pointer?: JSONPointer): any;
    isValid(data: any, schema?: JSONSchema, pointer?: JSONPointer): any;
    resolveOneOf(data: any, schema: JSONSchema, pointer?: JSONPointer): JSONSchema | import("../types").JSONError;
    resolveRef(schema: JSONSchema): JSONSchema;
    getSchema(pointer: JSONPointer, data: any, schema?: JSONSchema): JSONSchema;
    getTemplate(data?: unknown, schema?: JSONSchema): any;
    step(key: string, schema: JSONSchema, data: any, pointer?: JSONPointer): JSONSchema | import("../types").JSONError;
}
