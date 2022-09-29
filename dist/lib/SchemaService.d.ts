import { JsonEditor as Core } from "./jsoneditor";
import { JSONSchema, JSONPointer } from "./types";
export default class SchemaService {
    core: Core;
    schema: JSONSchema;
    data: any;
    cache: {
        [p: string]: JSONSchema;
    };
    constructor(schema: JSONSchema, data: any);
    updateData(data: any): void;
    updateSchema(schema: JSONSchema): void;
    get(pointer: JSONPointer, data: any): JSONSchema;
}
