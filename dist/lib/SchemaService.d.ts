import { JsonEditor as Draft } from "./jsoneditor";
import { JsonSchema, JsonPointer } from "./types";
export default class SchemaService {
    draft: Draft;
    schema: JsonSchema;
    data: unknown;
    cache: Record<string, JsonSchema>;
    constructor(schema: JsonSchema, data: unknown);
    updateData(data: unknown): void;
    updateSchema(schema: JsonSchema): void;
    get(pointer: JsonPointer, data: unknown): JsonSchema;
}
