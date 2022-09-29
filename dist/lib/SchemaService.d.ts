import { JsonEditor as Core } from "./jsoneditor";
import { JSONSchema, JSONPointer } from "./types";
export default class SchemaService {
    core: Core;
    schema: JSONSchema;
    data: unknown;
    cache: Record<string, JSONSchema>;
    constructor(schema: JSONSchema, data: unknown);
    updateData(data: unknown): void;
    updateSchema(schema: JSONSchema): void;
    get(pointer: JSONPointer, data: unknown): JSONSchema;
}
