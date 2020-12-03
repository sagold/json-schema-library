import gp from "gson-pointer";
import getTypeDefs from "./schema/getTypeDefs";
import { JSONSchema, JSONPointer } from "./types";


export interface OnSchema {
    (schema: JSONSchema, pointer: JSONPointer): void;
}

type Walker = {
    nextTypeDefs: typeof nextTypeDefs;
    callback: OnSchema;
}


const isObject = value => Object.prototype.toString.call(value) === "[object Object]";


function nextTypeDefs(schema: JSONSchema, pointer: JSONPointer) {
    if (this.callback(schema, pointer) === true) { // eslint-disable-line no-invalid-this
        return; // stop iteration
    }

    const defs = getTypeDefs(schema);
    // eslint-disable-next-line no-invalid-this
    defs.forEach(next => this.nextTypeDefs(next.def, gp.join(pointer, next.pointer, false)));
}


function eachDefinition(walk: Walker, schema: JSONSchema, pointer: JSONPointer) {
    Object.keys(schema.definitions)
        .forEach(defId => {
            if (!isObject(schema.definitions[defId])) {
                console.log(`Invalid schema in ${pointer}/definitions/${defId}`);
                return;
            }
            walk.nextTypeDefs(schema.definitions[defId], gp.join(pointer, "definitions", defId, false));
        });
}


export default function eachSchema(schema: JSONSchema, callback: OnSchema, pointer: JSONPointer = "#") {
    const walk = { callback, nextTypeDefs };
    walk.nextTypeDefs(schema, pointer);

    if (schema.definitions == null) {
        return;
    }

    walk.callback = (defschema, schemaPointer) => {
        callback(defschema, schemaPointer);
        if (defschema.definitions != null) {
            eachDefinition(walk, defschema, schemaPointer);
        }
    };

    eachDefinition(walk, schema, pointer);
}
