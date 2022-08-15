import getTypeOf from "./getTypeOf";
/**
 * Create a simple json schema for the given input data
 * @param  data - data to get json schema for
 * @return schema
 */
export default function createSchemaOf(data) {
    const schema = {
        type: getTypeOf(data)
    };
    if (schema.type === "object") {
        schema.properties = {};
        Object.keys(data).forEach((key) => (schema.properties[key] = createSchemaOf(data[key])));
    }
    if (schema.type === "array" && data.length === 1) {
        schema.items = createSchemaOf(data[0]);
    }
    else if (schema.type === "array") {
        schema.items = data.map(createSchemaOf);
    }
    return schema;
}
