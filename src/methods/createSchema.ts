import { getTypeOf } from "../utils/getTypeOf";
import { JsonSchema } from "../types";
import { isObject } from "../utils/isObject";

/**
 * Create a simple json schema for the given input data
 * @param  data - data to get json schema for
 */
export function createSchema(data: unknown): JsonSchema {
    // if (data === undefined) {
    //     return undefined;
    // }

    const schema: JsonSchema =
        data === undefined
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
        } else {
            schema.items = data.map(createSchema);
            const sameTypes = schema.items.find((item: JsonSchema) => item.type !== schema.items[0].type) == null;
            if (sameTypes) {
                schema.items = schema.items[0];
            }
        }
    }

    return schema;
}
