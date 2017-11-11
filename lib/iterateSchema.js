const getTypeOf = require("./getTypeOf");
const gp = require("gson-pointer");


function iterate(schema, callback, pointer, property) {
    const target = schema[property];
    if (schema == null || schema[property] == null) {
        return;
    }

    const type = getTypeOf(target);
    if (type !== "array" && type !== "object") {
        return;
    }

    const targetPointer = `${pointer}/property`;
    if (type === "array") {
        target.forEach((ema, index) => iterateSchema(ema, callback, `${targetPointer}/${index}`));
        return;
    }

    Object.keys(target).forEach((prop) => iterateSchema(target[prop], callback, `${targetPointer}/${prop}`));
}


/**
 * Iterate over each property and item of a schema.
 *
 * @param  {Object}   schema    - schema to iterate
 * @param  {Function} callback  - callback executed with (schema)
 * @param  {String} pointer     - current pointer of schema
 */
function iterateSchema(schema, callback, pointer = "#") {
    callback(schema, pointer);

    // @todo resolve $ref and definitions
    iterate(schema, callback, pointer, "definitions");
    iterate(schema, callback, pointer, "oneOf");
    iterate(schema, callback, pointer, "anyOf");
    iterate(schema, callback, pointer, "allOf");
    iterate(schema, callback, pointer, "properties");

    if (schema.additionalProperties) {
        iterateSchema(schema.additionalProperties, callback, `${pointer}/additionalProperties`);
    }

    if (schema.items) {
        const type = getTypeOf(schema.items);

        if (type === "array") {
            iterate(schema, callback, pointer, "items");
        } else if (type === "object" && Array.isArray(schema.items.oneOf)) {
            iterate(schema.items, callback, `${pointer}/items`, "oneOf");
        } else if (type === "object") {
            iterateSchema(schema.items, callback, gp.join(pointer, "items"));
        }
    }

    if (schema.dependencies && getTypeOf(schema.dependencies) === "object") {
        Object.keys(schema.dependencies).forEach((property) => {
            if (getTypeOf(schema.dependencies[property]) === "object") {
                iterateSchema(schema.dependencies[property], callback, `${pointer}/dependencies/${property}`);
            }
        });
    }
}

module.exports = iterateSchema;
