const typeValidation = require("./validation/type");


/**
 * Test if the data is valid according to the given schema
 *
 * @param  {Schema} schema      - json schema
 * @param  {Mixed} value         - value to validate
 * @param  {Function} step      - function retrieving the next json schema of a given key @see ./step.js
 * @param  {Schema} [root]      - root json schema
 * @param  {String} [pointer]   - json pointer pointing to value
 * @return {Boolean} if schema does match given value
 */
module.exports = function isValid(schema, value, step, root = schema, pointer = "#") {
    return typeValidation.validate(schema, value, step, root, pointer).length === 0;
};
