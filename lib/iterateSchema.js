const getTypeOf = require("./getTypeOf");
const gp = require("gson-pointer");


/**
 * Iterate over each property and item of a schema.
 *
 * @param  {Object}   schema    - schema to iterate
 * @param  {Function} callback  - callback executed with (schema)
 */
function iterateSchema(schema, callback, pointer = "#") {
    callback(schema, pointer);

    if (schema.definitions) {
        Object
            .keys(schema.definitions)
            .forEach((defProp) =>
                iterateSchema(schema.definitions[defProp], callback, gp.join(pointer, "definitions", defProp)
            ));
    }

    // @todo resolve $ref and definitions

    if (schema.oneOf && Array.isArray(schema.oneOf)) {
        schema.oneOf.forEach((oneOfSchema, index) =>
            iterateSchema(oneOfSchema, callback, gp.join(pointer, "oneOf", index))
        );
        return;
    }

    if (schema.type === "object" && getTypeOf(schema.properties) === "object") {
        Object.keys(schema.properties).forEach((prop) => {
            iterateSchema(schema.properties[prop], callback, gp.join(pointer, "properties", prop));
        });
        return;
    }

    if (schema.type === "array" && schema.items) {
        if (schema.items.oneOf && Array.isArray(schema.items.oneOf)) {
            schema.items.oneOf.forEach((oneOfSchema, index) =>
                iterateSchema(oneOfSchema, callback, gp.join(pointer, "items/oneOf", index))
            );
            return;
        }

        if (getTypeOf(schema.items) === "object") {
            iterateSchema(schema.items, callback, gp.join(pointer, "items"));
            return;
        }

        if (getTypeOf(schema.items) === "array") {
            schema.items.forEach((itemSchema, index) =>
                iterateSchema(itemSchema, callback, gp.join(pointer, "items", index)));
            return;
        }
    }

    // if (schema.type === "object" || schema.type === "array") {
    //     console.log(`Failed further iterating schema ${JSON.stringify(schema)}`);
    // }
}

module.exports = iterateSchema;
