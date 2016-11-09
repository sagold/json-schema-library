const step = require("./step");
const emptyObject = {};


/**
 * Returns the json schema of the given data-json-pointer
 *
 * @param  {Object} schema      - the json schema (root)
 * @param  {String} pointer     - json pointer in data to get the json schema for
 * @param  {Mixed} data         - the data object, which includes the json pointers value. This is optional, as long as
 *                                  no oneOf, anyOf, etc statement ist part of the pointers schema
 * @return {Object|Error} json schema object of json pointer or an error
 */
function getSchema(schema, pointer, data) {
    const frags = pointer.replace(/^[#\/]+/, "").split("/");
    return _get(schema, frags, "#", schema, data);
}


function _get(schema, frags, pointer, rootSchema, data = emptyObject) {
    if (frags.length === 0 || frags[0] === "") {
        return schema;
    }

    const key = frags.shift(); // step key
    schema = step(key, schema, data, rootSchema); // step schema
    if (schema instanceof Error) {
        return schema;
    }
    if (schema === false) {
        return new Error(`Could not match oneOf: ${JSON.stringify(schema)}`);
    }
    data = data[key]; // step data
    return _get(schema, frags, `${pointer}/${key}`, rootSchema, data);
}


module.exports = getSchema;
