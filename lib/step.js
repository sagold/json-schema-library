const getTypeOf = require("./getTypeOf");
const createSchemaOf = require("./createSchemaOf");
const errors = require("./validation/errors");


/**
 * Returns the json schema to the given key
 *
 * @param  {CoreInterface} core     - validator
 * @param  {String|Number} key      - property-name or array-index
 * @param  {Object} schema          - json schema of current data
 * @param  {Object|Array} data      - parent of key
 * @param  {String} pointer
 * @return {Object|Error} Schema or Error if failed resolving key
 */
function step(core, key, schema, data, pointer) {
    const expectedType = schema.type || getTypeOf(data);

    if (expectedType === "object") {
        if (schema.oneOf && Array.isArray(schema.oneOf)) {
            schema = core.resolveOneOf(schema, data, pointer);
            if (schema && schema.type === "error") {
                return schema;
            }
            if (schema && schema.properties[key] !== undefined) {
                return core.resolveRef(schema.properties[key]);
            }

            return errors.oneOfPropertyError({ property: key, value: data, pointer });
        }

        if (schema.properties && schema.properties[key] !== undefined) {
            return core.resolveRef(schema.properties[key]);
        }
    }

    if (expectedType === "array") {
        // oneOf
        if (schema.items && Array.isArray(schema.items.oneOf)) {
            return core.resolveOneOf(schema.items, data[key], pointer) || false;
        }
        // schema
        if (schema.items && getTypeOf(schema.items) === "object") {
            return core.resolveRef(schema.items);
        }
        // list of items
        if (schema.items && Array.isArray(schema.items)) {

            if (schema.items[key]) {
                return core.resolveRef(schema.items[key]);
            }

            if (schema.additionalItems === false) {
                return errors.additionalItemsError({ key, value: data[key], pointer });
            }

            if (schema.additionalItems === true || schema.additionalItems === undefined) {
                return createSchemaOf(data[key]);
            }

            if (getTypeOf(schema.additionalItems) === "object") {
                return schema.additionalItems;
            }

            throw new Error(`Invalid schema ${JSON.stringify(schema, null, 4)} for ${JSON.stringify(data, null, 4)}`);
        }
        if (schema.additionalItems !== false) {
            // @todo reevaluate: incomplete schema is created here
            // @todo support additionalItems: {schema}
            return createSchemaOf(data[key]);
        }

        return new Error(`Invalid array schema for ${key} at ${pointer}`);
    }

    return new Error(`Unsupported schema type ${schema.type} for key ${key}`);
}


module.exports = step;
