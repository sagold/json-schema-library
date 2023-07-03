import gp from "@sagold/json-pointer";
import getTypeDefs from "./schema/getTypeDefs";
import { JsonSchema, JsonPointer } from "./types";
import { isObject } from "./utils/isObject";

export type EachSchemaCallback = (schema: JsonSchema, pointer: JsonPointer) => void;

type Walker = {
    nextTypeDefs: typeof nextTypeDefs;
    callback: EachSchemaCallback;
};

function nextTypeDefs(schema: JsonSchema, pointer: JsonPointer) {
    if (this.callback(schema, pointer) === true) {
        // eslint-disable-line no-invalid-this
        return; // stop iteration
    }

    const defs = getTypeDefs(schema);
    // eslint-disable-next-line no-invalid-this
    defs.forEach((next) => this.nextTypeDefs(next.def, gp.join(pointer, next.pointer, false)));
}

function eachDefinition(
    walk: Walker,
    schema: JsonSchema,
    pointer: JsonPointer,
    key = "definitions"
) {
    const defs = schema[key];
    Object.keys(defs).forEach((defId) => {
        if (defs[defId] === false || isObject(defs[defId])) {
            walk.nextTypeDefs(defs[defId], gp.join(pointer, key, defId, false));
            return;
        }
        // console.log(`Invalid schema in ${pointer}/${key}/${defId}`);
    });
}

export function eachSchema(
    schema: JsonSchema,
    callback: EachSchemaCallback,
    pointer: JsonPointer = "#"
) {
    const walk = { callback, nextTypeDefs };
    walk.nextTypeDefs(schema, pointer);

    if (schema.definitions != null) {
        walk.callback = (defschema, schemaPointer) => {
            callback(defschema, schemaPointer);
            if (defschema.definitions != null) {
                eachDefinition(walk, defschema, schemaPointer);
            }
        };

        eachDefinition(walk, schema, pointer);
    }

    if (schema.$defs != null) {
        walk.callback = (defschema, schemaPointer) => {
            callback(defschema, schemaPointer);
            if (defschema.definitions != null) {
                eachDefinition(walk, defschema, schemaPointer);
            }
        };

        eachDefinition(walk, schema, pointer, "$defs");
    }
}
