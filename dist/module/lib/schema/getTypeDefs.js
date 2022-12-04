import gp from "@sagold/json-pointer";
import { get } from "@sagold/json-query";
import getTypeId from "./getTypeId";
import types from "./types";
const isObject = (value) => Object.prototype.toString.call(value) === "[object Object]";
/**
 * Returns a list of all (direct) type definitions from the given schema
 * @param schema
 * @return list of type definition, given as { pointer, def }
 */
export default function getTypeDefs(schema) {
    const defs = [];
    const id = getTypeId(schema);
    if (id == null) {
        return defs;
    }
    let type;
    if (Array.isArray(id)) {
        // since types can also be declared as a set of types, merge the definitions
        // maybe this will require a more sophisticated approach
        type = {};
        for (let i = 0, l = id.length; i < l; i += 1) {
            Object.assign(type, types[id[i]]);
        }
    }
    else {
        type = types[id];
    }
    if (type.definitions == null) {
        return defs;
    }
    type.definitions.forEach((query) => {
        get(schema, query, (value, key, parent, pointer) => {
            if (isObject(value) && getTypeId(value)) {
                defs.push({ pointer: gp.join(gp.split(pointer), false), def: value });
            }
        });
    });
    return defs;
}
