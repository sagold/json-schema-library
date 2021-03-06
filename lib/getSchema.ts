import gp from "gson-pointer";
import { JSONSchema, JSONPointer } from "./types";
import Core from "./cores/CoreInterface";


const emptyObject = {};


/**
 * Returns the json-schema of a data-json-pointer.
 *
 *  Notes
 *      - Uses core.step to walk through data and schema
 *
 * @param core
 * @param pointer - json pointer in data to get the json schema for
 * @param [data] - the data object, which includes the json pointers value. This is optional, as
 *    long as no oneOf, anyOf, etc statement is part of the pointers schema
 * @param [schema] - the json schema to iterate. Defaults to core.rootSchema
 * @return json schema object of the json-pointer or an error
 */
export default function getSchema(core: Core, pointer: JSONPointer, data?: any, schema: JSONSchema = core.rootSchema): JSONSchema {
    const frags = gp.split(pointer);
    return _get(core, schema, frags, pointer, data);
}


function _get(core: Core, schema: JSONSchema, frags: Array<string>, pointer: JSONPointer, data: any = emptyObject): JSONSchema {
    if (frags.length === 0) {
        return schema;
    }

    const key = frags.shift(); // step key
    schema = core.step(key, schema, data, pointer); // step schema
    if (schema && schema.type === "error") {
        return schema;
    }
    data = data[key]; // step data
    return _get(core, schema, frags, `${pointer}/${key}`, data);
}
