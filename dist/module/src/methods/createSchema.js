import { getTypeOf } from "../utils/getTypeOf.js";
import { isObject } from "../utils/isObject.js";
/**
 * Create a simple json schema for the given input data
 * @param  data - data to get json schema for
 */
export function createSchema(data) {
    // if (data === undefined) {
    //     return undefined;
    // }
    const schema = data === undefined
        ? {}
        : {
            type: getTypeOf(data)
        };
    if (schema.type === "object" && isObject(data)) {
        schema.properties = {};
        Object.keys(data).forEach((key) => (schema.properties[key] = createSchema(data[key])));
    }
    if (schema.type === "array" && Array.isArray(data)) {
        if (data.length === 1) {
            schema.items = createSchema(data[0]);
        }
        else {
            schema.items = data.map(createSchema);
            const sameTypes = schema.items.find((item) => item.type !== schema.items[0].type) == null;
            if (sameTypes) {
                schema.items = schema.items[0];
            }
        }
    }
    return schema;
}
