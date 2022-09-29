import gp from "gson-pointer";
import getTypeDefs from "./schema/getTypeDefs";
const isObject = value => Object.prototype.toString.call(value) === "[object Object]";
function nextTypeDefs(schema, pointer) {
    if (this.callback(schema, pointer) === true) { // eslint-disable-line no-invalid-this
        return; // stop iteration
    }
    const defs = getTypeDefs(schema);
    // eslint-disable-next-line no-invalid-this
    defs.forEach(next => this.nextTypeDefs(next.def, gp.join(pointer, next.pointer, false)));
}
function eachDefinition(walk, schema, pointer) {
    Object.keys(schema.definitions)
        .forEach(defId => {
        if (schema.definitions[defId] === false || isObject(schema.definitions[defId])) {
            walk.nextTypeDefs(schema.definitions[defId], gp.join(pointer, "definitions", defId, false));
            return;
        }
        console.log(`Invalid schema in ${pointer}/definitions/${defId}`);
    });
}
export default function eachSchema(schema, callback, pointer = "#") {
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
