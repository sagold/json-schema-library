const getTypeOf = require("./getTypeOf");


/**
 * Create a simple json schema for the given input data
 * @param  {Mixed} data     - data to get json schema for
 * @return {Object} schema
 */
function createSchemaOf(data) {
    const schema = {
        type: getTypeOf(data)
    };

    if (schema.type === "object") {
        schema.properties = {};
        Object.keys(data).forEach(key => (schema.properties[key] = createSchemaOf(data[key])));
    }

    if (schema.type === "array" && data.length === 1) {
        schema.items = createSchemaOf(data[0]);

    } else if (schema.type === "array") {
        schema.items = data.map(createSchemaOf);
    }

    return schema;
}


module.exports = createSchemaOf;

