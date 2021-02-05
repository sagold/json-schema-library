import gp from "gson-pointer";
import gq from "gson-query";
import getTypeId from "./getTypeId";
import types from "./types";
import { JSONSchema, JSONPointer } from "../types";


const isObject = value => Object.prototype.toString.call(value) === "[object Object]";


/**
 * Returns a list of all (direct) type definitions from the given schema
 * @param schema
 * @return list of type definition, given as { pointer, def }
 */
export default function getTypeDefs(schema: JSONSchema): Array<{ pointer: JSONPointer, def: any }> {
    const defs = [];
    const id = getTypeId(schema);
    if (id == null) {
        return defs;
    }
    const type = types[id];
    if (type.definitions == null) {
        return defs;
    }

    type.definitions.forEach(query => {
        gq.run(schema, query, (value, key, parent, pointer) => {
            if (isObject(value) && getTypeId(value)) {
                defs.push({ pointer: gp.join(gp.split(pointer), false), def: value });
            }
        });
    });

    return defs;
}
