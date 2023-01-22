import getSchema from "./getSchema";
import { JsonEditor as Draft } from "./jsoneditor";
import gp from "@sagold/json-pointer";
import copy from "./utils/copy";
import { JsonSchema, JsonPointer } from "./types";

export default class SchemaService {
    draft: Draft;
    schema: JsonSchema;
    data: unknown;
    cache: Record<string, JsonSchema>;

    constructor(schema: JsonSchema, data: unknown) {
        this.draft = new Draft(schema);
        this.schema = schema;
        this.data = data;
        this.cache = {};
    }

    updateData(data: unknown) {
        this.data = data;
        this.cache = {};
    }

    updateSchema(schema: JsonSchema) {
        this.schema = schema;
        this.draft.setSchema(schema);
        this.cache = {};
    }

    get(pointer: JsonPointer, data: unknown): JsonSchema {
        if (data) {
            // possibly separate entry point
            const schema = getSchema(this.draft, pointer, data, this.schema);
            return copy(schema);
        }

        if (pointer === "#") {
            // root
            return this.schema;
        }

        if (this.cache[pointer]) {
            // return cached result
            return this.cache[pointer];
        }

        const parentPointer = gp.join(pointer, "..");
        let parentSchema = this.cache[parentPointer];
        if (parentSchema == null) {
            // store parent (major performance improvement if its within oneof)
            parentSchema = getSchema(this.draft, parentPointer, this.data, this.schema);
            if (parentSchema.variableSchema !== true) {
                this.cache[parentPointer] = copy(parentSchema);
            }
        }

        // step from parent to child
        const key = gp.split(pointer).pop();
        let schema = getSchema(
            this.draft,
            key,
            gp.get(this.data, parentPointer),
            this.cache[parentPointer]
        );
        schema = copy(schema);
        if (schema.variableSchema !== true) {
            this.cache[pointer] = schema;
        }
        return schema;
    }
}
