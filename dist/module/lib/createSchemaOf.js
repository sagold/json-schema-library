import getTypeOf from "./getTypeOf";
import { isObject } from "./utils/isObject";
/**
 * Create a simple json schema for the given input data
 * @param  data - data to get json schema for
 */
export default function createSchemaOf(data) {
    if (data === undefined) {
        return undefined;
    }
    const schema = {
        type: getTypeOf(data)
    };
    if (schema.type === "object" && isObject(data)) {
        schema.properties = {};
        Object.keys(data).forEach((key) => (schema.properties[key] = createSchemaOf(data[key])));
    }
    if (schema.type === "array" && Array.isArray(data)) {
        if (data.length === 1) {
            schema.items = createSchemaOf(data[0]);
        }
        else {
            schema.items = data.map(createSchemaOf);
        }
    }
    return schema;
}
