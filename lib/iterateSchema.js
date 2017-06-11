const getTypeOf = require("./getTypeOf");
const gp = require("gson-pointer");


/**
 * Iterate over each property and item of a schema.
 *
 * @param  {Object}   schema    - schema to iterate
 * @param  {Function} callback  - callback executed with (schema)
 */
function iteratSchema(schema, callback, pointer = "#") {
    callback(schema, pointer);

    // @todo resolve $ref and definitions

    if (schema.oneOf && Array.isArray(schema.oneOf)) {
        schema.oneOf.forEach((oneOfSchema, index) =>
            iteratSchema(oneOfSchema, callback, gp.join(pointer, "oneOf", index))
        );
        return;
    }

    if (schema.type === "object" && getTypeOf(schema.properties) === "object") {
        Object.keys(schema.properties).forEach((prop) => {
            iteratSchema(schema.properties[prop], callback, gp.join(pointer, "properties", prop));
        });
        return;
    }

    if (schema.type === "array" && schema.items) {
        if (schema.items.oneOf && Array.isArray(schema.items.oneOf)) {
            schema.items.oneOf.forEach((oneOfSchema, index) =>
                iteratSchema(oneOfSchema, callback, gp.join(pointer, "items/oneOf", index))
            );
            return;
        }

        if (getTypeOf(schema.items) === "object") {
            iteratSchema(schema.items, callback, gp.join(pointer, "items"));
            return;
        }

        if (getTypeOf(schema.items) === "array") {
            schema.items.forEach((itemSchema, index) =>
                iteratSchema(itemSchema, callback, gp.join(pointer, "items", index)));
            return;
        }
    }

    // if (schema.type === "object" || schema.type === "array") {
    //     console.log(`Failed further iterating schema ${JSON.stringify(schema)}`);
    // }
}

module.exports = iteratSchema;
