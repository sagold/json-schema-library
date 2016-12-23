const typeValidation = require("./validation/type");


/**
 * Validate data by a json schema
 *
 * @param  {Mixed} value         - value to validate
 * @param  {Schema} schema      - json schema
 * @param  {Function} step      - function retrieving the next json schema of a given key @see ./step.js
 * @param  {Schema} [root]      - root json schema
 * @param  {String} [pointer]   - json pointer pointing to value
 * @return {Array} list of errors or empty
 */
module.exports = function validate(schema, value, step, root = schema, pointer = "#") {
    return typeValidation.validate(schema, value, step, root, pointer);
};
