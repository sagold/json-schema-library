const typeValidation = require("./validation/type");


/**
 * Test if the data is valid according to the given schema
 *
 * @param  {Mixed} value         - value to validate
 * @param  {Schema} schema      - json schema
 * @param  {Function} step      - function retrieving the next json schema of a given key @see ./step.js
 * @param  {Schema} [root]      - root json schema
 * @param  {String} [pointer]   - json pointer pointing to value
 * @return {Boolean} if schema does match given value
 */
function isValid(value, schema, step, root = schema, pointer = "#") {
    if (typeof step !== "function") {
        throw new Error(`Expected step to be a function. Got: ${typeof step}`);
    }
    return typeValidation.validate(schema, value, step, root, pointer).length === 0;
}


module.exports = isValid;
