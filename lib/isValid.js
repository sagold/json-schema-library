/**
 * Test if the data is valid according to the given schema
 *
 * @param  {CoreInterface} core - validator
 * @param  {Schema} schema      - json schema
 * @param  {Mixed} value        - value to validate
 * @param  {String} [pointer]   - json pointer pointing to value
 * @return {Boolean} if schema does match given value
 */
module.exports = function isValid(core, schema, value, pointer = "#") {
    return core.validate(schema, value, pointer).length === 0;
};
