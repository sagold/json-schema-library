/**
 * Validate any given pattern
 * @param  {Object} schema
 * @param  {Mixed} value
 * @return {Object|Boolean} schema or false
 */
module.exports = function validPattern(schema, value) {
    if (schema.pattern) {
        const pattern = new RegExp(schema.pattern);
        return pattern.test(value) ? schema : false;
    }
    return schema;
};
