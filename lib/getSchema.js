const gp = require("gson-pointer");
const emptyObject = {};


/**
 * Returns the json-schema of a data-json-pointer.
 *
 *  Notes
 *      - Uses core.step to walk through data and schema
 *
 * @param  {CoreInterface} core
 * @param  {String} pointer     - json pointer in data to get the json schema for
 * @param  {Mixed} [data]       - the data object, which includes the json pointers value. This is optional, as
 *                                 long as no oneOf, anyOf, etc statement is part of the pointers schema
 * @param  {Object} [schema]    - the json schema to iterate. Defaults to core.rootSchema
 * @return {Object|Error} json schema object of the json-pointer or an error
 */
function getSchema(core, pointer, data, schema = core.rootSchema) {
    const frags = gp.split(pointer);
    return _get(core, schema, frags, pointer, data);
}


function _get(core, schema, frags, pointer, data = emptyObject) {
    if (frags.length === 0) {
        return schema;
    }

    const key = frags.shift(); // step key
    schema = core.step(key, schema, data, pointer); // step schema
    if (schema && schema.type === "error") {
        return schema;
    }
    data = data[key]; // step data
    return _get(core, schema, frags, `${pointer}/${key}`, data);
}


module.exports = getSchema;
