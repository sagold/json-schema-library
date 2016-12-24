const getTypeOf = require("./getTypeOf");
const resolveRef = require("./resolveRef");
const resolveOneOf = require("./resolveOneOf");
const createSchemaOf = require("./createSchemaOf");
const Errors = require("./validation/errors");

/**
 * Returns the json schema to the given key
 *
 * @param  {String|Number} key      - property-name or array-index
 * @param  {Object} schema          - json schema of current data
 * @param  {Object|Array} data      - parent of key
 * @param  {Object} root            - json schema root node
 * @param  {String} pointer
 * @return {Object|Error} Schema or Error if failed resolving key
 */
function step(key, schema, data, root = schema, pointer) {
    const expectedType = schema.type || getTypeOf(data);

    if (expectedType === "object") {
        if (schema.oneOf && Array.isArray(schema.oneOf)) {
            schema = resolveOneOf(schema, data, step, root);
            if (schema && schema.properties[key] !== undefined) {
                return resolveRef(schema.properties[key], root);
            }
            return new Error(`Failed finding ${key} in oneOf ${JSON.stringify(schema)}`);
        }

        if (schema.properties && schema.properties[key] !== undefined) {
            return resolveRef(schema.properties[key], root);
        }
    }

    if (expectedType === "array") {
        // oneOf
        if (schema.items && Array.isArray(schema.items.oneOf)) {
            return resolveOneOf(schema.items, data[key], step, root) || false;
        }
        // schema
        if (schema.items && getTypeOf(schema.items) === "object") {
            return resolveRef(schema.items, root);
        }
        // list of items
        if (schema.items && Array.isArray(schema.items)) {

            if (schema.items[key]) {
                return resolveRef(schema.items[key], root);
            }

            if (schema.additionalItems === false) {
                return new Errors.AdditionalItemsError({ key, value: data[key], pointer });
            }

            if (schema.additionalItems === true || schema.additionalItems === undefined) {
                return createSchemaOf(data[key]);
            }

            if (getTypeOf(schema.additionalItems) === "object") {
                return schema.additionalItems;
            }

            throw new Error(`Unsupported schema for items ${JSON.stringify(schema, null, 4)}`);
        }
        if (schema.additionalItems !== false) {
            // @todo reevaluate: incomplete schema is created here
            // @todo support additionalItems: {schema}
            return createSchemaOf(data[key]);
        }
        return new Error(`Unsupported array schema at ${key}`);
    }

    return new Error(`Unsupported type ${schema.type} for key ${key}`);
}


module.exports = step;
