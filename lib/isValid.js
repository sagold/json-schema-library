const typeValidation = require("./validation/type");


/**
 * Test if the data is valid according to the given schema
 *
 * @param  {Mixed} data     - data to validate
 * @param  {Schema} schema  - json schema
 * @param  {Function} step  - function retrieving the next json schema of a given key @see ./step.js
 * @param  {Schema} root    - root json schema
 * @return {Mixed|false} the input json schema or false if schema does not match data
 */
function isValid(data, schema, step, root = schema, pointer = "#") {
    if (typeof step !== "function") {
        throw new Error(`Expected step to be a function. Got: ${typeof step}`);
    }
    const result = typeValidation.validate(schema, data, step, root, pointer);
    return result.length === 0 ? schema : false;
}


module.exports = isValid;
