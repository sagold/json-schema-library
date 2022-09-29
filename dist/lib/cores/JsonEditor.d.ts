import CoreInterface from "./CoreInterface";
import { JSONSchema, JSONPointer } from "../types";
export default class JsonEditorCore extends CoreInterface {
    constructor(schema?: JSONSchema);
    each(data: any, callback: any, schema?: JSONSchema, pointer?: JSONPointer): void;
    validate(data: any, schema?: JSONSchema, pointer?: JSONPointer): any;
    isValid(data: any, schema?: JSONSchema, pointer?: JSONPointer): any;
    resolveOneOf(data: any, schema: JSONSchema, pointer: JSONPointer): JSONSchema | import("../types").JSONError;
    resolveRef(schema: JSONSchema): JSONSchema;
    getSchema(pointer: JSONPointer, data: any, schema?: JSONSchema): JSONSchema;
    getTemplate(data: any, schema?: JSONSchema): any;
    step(key: string, schema: JSONSchema, data: any, pointer?: JSONPointer): JSONSchema | import("../types").JSONError;
}
