import getSchema from "./getSchema";
import { JsonEditor as Core } from "./jsoneditor";
import gp from "@sagold/json-pointer";
import copy from "./utils/copy";
import { JSONSchema, JSONPointer } from "./types";

export default class SchemaService {
    core: Core;
    schema: JSONSchema;
    data: unknown;
    cache: Record<string, JSONSchema>;

    constructor(schema: JSONSchema, data: unknown) {
        this.core = new Core(schema);
        this.schema = schema;
        this.data = data;
        this.cache = {};
    }

    updateData(data: unknown) {
        this.data = data;
        this.cache = {};
    }

    updateSchema(schema: JSONSchema) {
        this.schema = schema;
        this.core.setSchema(schema);
        this.cache = {};
    }

    get(pointer: JSONPointer, data: unknown): JSONSchema {
        if (data) {
            // possibly separate entry point
            const schema = getSchema(this.core, pointer, data, this.schema);
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
            parentSchema = getSchema(this.core, parentPointer, this.data, this.schema);
            if (parentSchema.variableSchema !== true) {
                this.cache[parentPointer] = copy(parentSchema);
            }
        }

        // step from parent to child
        const key = gp.split(pointer).pop();
        let schema = getSchema(
            this.core,
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
