const resolveRef = require("./resolveRef");
const guessOneOfSchema = require("./guessOneOfSchema");


function step(key, schema, data, rootSchema = schema) {
    if (schema.type === "object") {
        if (schema.oneOf && Array.isArray(schema.oneOf)) {
            schema = guessOneOfSchema(schema, data, rootSchema);
            if (schema && schema.properties[key] !== undefined) {
                return resolveRef(schema.properties[key], rootSchema);
            }
            return new Error(`Failed finding ${key} in oneOf ${JSON.stringify(schema)}`);
        }

        if (schema.properties && schema.properties[key] !== undefined) {
            return resolveRef(schema.properties[key], rootSchema);
        }
    }

    if (schema.type === "array") {
        if (schema.items && Array.isArray(schema.items.oneOf)) {
            return guessOneOfSchema(schema.items, data[key], rootSchema) || false;
        }
        if (schema.items && Object.prototype.toString.call(schema.items) === "[object Object]") {
            return resolveRef(schema.items, rootSchema);
        }
        if (schema.items && Array.isArray(schema.items)) {
            return resolveRef(schema.items[key], rootSchema);
        }
        return new Error(`Unsupported array schema at ${key}`);
    }

    return new Error(`Unsupported type ${schema.type} for key ${key}`);
}


module.exports = step;
