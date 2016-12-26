const emptyObject = {};
const Errors = require("./validation/errors");


/**
 * Returns the json schema of the given data-json-pointer
 *
 * @param  {CoreInterface} core - validator
 * @param  {Object} schema      - the json schema (root)
 * @param  {Mixed} data         - the data object, which includes the json pointers value. This is optional, as long as
 *                                  no oneOf, anyOf, etc statement is part of the pointers schema
 * @param  {String} pointer     - json pointer in data to get the json schema for
 * @return {Object|Error} json schema object of json pointer or an error
 */
function getSchema(core, schema, data, pointer = "#") {
    const frags = pointer.replace(/^[#\/]+/, "").split("/");
    return _get(core, schema, frags, pointer, data);
}


function _get(core, schema, frags, pointer, data = emptyObject) {
    if (frags.length === 0 || frags[0] === "") {
        return schema;
    }

    const key = frags.shift(); // step key
    schema = core.step(key, schema, data, pointer); // step schema
    if (schema instanceof Error) {
        return schema;
    }
    if (schema === false) {
        return new Errors.OneOfError({ value: data, schema, pointer });
    }
    data = data[key]; // step data
    return _get(core, schema, frags, `${pointer}/${key}`, data);
}


module.exports = getSchema;
