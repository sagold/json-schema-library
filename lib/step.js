const resolveRef = require("./resolveRef");
const guessOneOfSchema = require("./guessOneOfSchema");
const createSchemaOf = require("./createSchemaOf");


function step(key, schema, data, rootSchema = schema) {
    if (schema.type === "object") {
        if (schema.oneOf && Array.isArray(schema.oneOf)) {
            schema = guessOneOfSchema(schema, data, step, rootSchema);
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
            return guessOneOfSchema(schema.items, data[key], step, rootSchema) || false;
        }
        if (schema.items && Object.prototype.toString.call(schema.items) === "[object Object]") {
            return resolveRef(schema.items, rootSchema);
        }
        if (schema.items && Array.isArray(schema.items)) {
            return resolveRef(schema.items[key], rootSchema);
        }
        if (schema.additionalItems !== false) {
            // @todo reevaluate: incomplete schema is created here
            return createSchemaOf(data[key]);
        }
        return new Error(`Unsupported array schema at ${key}`);
    }

    return new Error(`Unsupported type ${schema.type} for key ${key}`);
}


module.exports = step;
