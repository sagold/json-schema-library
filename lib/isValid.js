/**
 * Test if the data is valid according to the given schema
 *
 * @param  {CoreInterface} core - validator
 * @param  {Mixed} value        - value to validate
 * @param  {Schema} [schema]    - json schema
 * @param  {String} [pointer]   - json pointer pointing to value
 * @return {Boolean} if schema does match given value
 */
module.exports = function isValid(core, value, schema = core.rootSchema, pointer = "#") {
    return core.validate(value, schema, pointer).length === 0;
};
